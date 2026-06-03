import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, firstValueFrom, from, interval, map, of, switchMap, tap, timeout } from 'rxjs';
import { API_BASE_URL } from 'src/app/globals';
import {
  OfflineMutation,
  OfflineMutationOutcome,
  SyncMutationResponseItem,
  SyncMutationsResponse
} from './offline.types';
import { OfflineDbService } from './offline-db.service';

type MutationDraft<TPayload> = {
  type: OfflineMutation['type'];
  entityId: string;
  tournamentId?: string;
  baseRevision?: number | null;
  authMode?: OfflineMutation['authMode'];
  token?: string;
  tokenFingerprint?: string;
  payload: TPayload;
};

@Injectable({ providedIn: 'root' })
export class OfflineSyncService {
  private readonly onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  private readonly pendingCountSubject = new BehaviorSubject<number>(0);
  private readonly conflictCountSubject = new BehaviorSubject<number>(0);
  private syncRunning = false;
  private readonly judgeTokens = new Map<string, string>();

  readonly online$ = this.onlineSubject.asObservable();
  readonly pendingCount$ = this.pendingCountSubject.asObservable();
  readonly conflictCount$ = this.conflictCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private db: OfflineDbService,
    private zone: NgZone
  ) {
    window.addEventListener('online', () => this.zone.run(() => this.checkConnection(true)));
    window.addEventListener('offline', () => this.zone.run(() => this.setOnline(false)));
    interval(15000).subscribe(() => this.checkConnection(false));
    this.refreshCounts();
    this.checkConnection(false);
  }

  prepareTournament(tournamentId: string): Observable<unknown> {
    return this.http.get(`${API_BASE_URL}/sync/bootstrap`, {
      params: { tournamentId }
    }).pipe(
      switchMap(snapshot => from(this.db.putSnapshot({
        key: `tournament:${tournamentId}`,
        tournamentId,
        data: snapshot,
        updatedAt: new Date().toISOString()
      })).pipe(map(() => snapshot)))
    );
  }

  cachedTournament<T = unknown>(tournamentId: string): Observable<T | null> {
    return from(this.db.getSnapshot<T>(`tournament:${tournamentId}`)).pipe(
      map(snapshot => snapshot?.data ?? null)
    );
  }

  registerJudgeToken(token: string): Observable<string> {
    return from(this.tokenFingerprint(token)).pipe(
      tap(fingerprint => this.judgeTokens.set(fingerprint, token))
    );
  }

  cacheJudgeSession(token: string, session: unknown): Observable<unknown> {
    return this.registerJudgeToken(token).pipe(
      switchMap(fingerprint => from(this.db.putSnapshot({
        key: `judge:${fingerprint}`,
        data: session,
        updatedAt: new Date().toISOString()
      }))),
      map(() => session)
    );
  }

  cachedJudgeSession<T = unknown>(token: string): Observable<T | null> {
    return this.registerJudgeToken(token).pipe(
      switchMap(fingerprint => from(this.db.getSnapshot<T>(`judge:${fingerprint}`))),
      map(snapshot => snapshot?.data ?? null)
    );
  }

  mutate<TResponse = unknown, TPayload = unknown>(
    draft: MutationDraft<TPayload>,
    optimisticResult?: TResponse
  ): Observable<OfflineMutationOutcome<TResponse>> {
    return from(this.createMutation(draft)).pipe(
      switchMap(mutation => this.commitMutation(draft, mutation, optimisticResult))
    );
  }

  private commitMutation<TResponse = unknown, TPayload = unknown>(
    draft: MutationDraft<TPayload>,
    mutation: OfflineMutation<TPayload>,
    optimisticResult?: TResponse
  ): Observable<OfflineMutationOutcome<TResponse>> {
    if (!this.onlineSubject.value) {
      return from(this.queue(mutation)).pipe(
        map(() => ({ status: 'queued' as const, result: optimisticResult, mutation }))
      );
    }

    return this.sendMutations<TResponse>([mutation], draft.authMode === 'judge' ? draft.token : undefined).pipe(
      switchMap(response => this.handleImmediateResponse<TResponse>(mutation, response, optimisticResult)),
      catchError(error => {
        if (this.isOfflineError(error)) {
          this.setOnline(false);
          return from(this.queue(mutation)).pipe(
            map(() => ({ status: 'queued' as const, result: optimisticResult, mutation }))
          );
        }

        return from(this.markFailed(mutation, error?.error?.message || 'Nie udało się zapisać zmiany')).pipe(
          map(() => ({
            status: 'failed' as const,
            result: optimisticResult,
            mutation,
            message: error?.error?.message || 'Nie udało się zapisać zmiany'
          }))
        );
      })
    );
  }

  syncPending(): void {
    if (this.syncRunning || !this.onlineSubject.value) return;
    this.syncRunning = true;

    from(this.db.pendingMutations()).pipe(
      switchMap(mutations => {
        if (!mutations.length) return of(null);
        return from(this.syncMutationGroups(mutations));
      }),
      catchError(error => {
        this.setOnline(!this.isOfflineError(error));
        return of(null);
      })
    ).subscribe({
      next: () => {
        this.syncRunning = false;
        this.refreshCounts();
      },
      error: () => {
        this.syncRunning = false;
        this.refreshCounts();
      }
    });
  }

  conflicts(): Observable<OfflineMutation[]> {
    return from(this.db.mutationsByStatus(['conflict']));
  }

  discardConflict(clientMutationId: string): Observable<void> {
    return from(this.db.updateMutation(clientMutationId, { status: 'failed' })).pipe(
      tap(() => this.refreshCounts()),
      map(() => undefined)
    );
  }

  retryConflict(mutation: OfflineMutation): Observable<void> {
    const conflict = (mutation.conflict || {}) as any;
    const payload = this.payloadForConflictRetry(mutation);
    if (!payload) {
      return from(this.db.updateMutation(mutation.clientMutationId, {
        lastError: 'Nie można automatycznie zastosować tej lokalnej zmiany. Sprawdź aktualnego zawodnika i konkurencję.'
      })).pipe(map(() => undefined));
    }

    const next: OfflineMutation = {
      ...mutation,
      clientMutationId: this.createMutationId(),
      status: 'pending',
      baseRevision: conflict?.serverRevision ?? mutation.baseRevision ?? null,
      payload,
      createdAt: new Date().toISOString()
    };

    return from(Promise.all([
      this.db.updateMutation(mutation.clientMutationId, { status: 'failed' }),
      this.db.putMutation(next)
    ])).pipe(
      tap(() => {
        this.refreshCounts();
        this.syncPending();
      }),
      map(() => undefined)
    );
  }

  private handleImmediateResponse<TResponse>(
    mutation: OfflineMutation,
    response: SyncMutationsResponse<TResponse>,
    optimisticResult?: TResponse
  ): Observable<OfflineMutationOutcome<TResponse>> {
    const applied = response.applied.find(item => item.clientMutationId === mutation.clientMutationId);
    const conflict = response.conflicts.find(item => item.clientMutationId === mutation.clientMutationId);
    const failed = response.failed.find(item => item.clientMutationId === mutation.clientMutationId);

    if (applied) {
      this.refreshCounts();
      return of({
        status: 'applied',
        result: (applied.result as TResponse) ?? optimisticResult,
        mutation
      });
    }

    if (conflict) {
      return from(this.db.putMutation({
        ...mutation,
        status: 'conflict',
        conflict: conflict.conflict
      })).pipe(
        tap(() => this.refreshCounts()),
        map(() => ({
          status: 'conflict' as const,
          result: optimisticResult,
          mutation: {
            ...mutation,
            status: 'conflict' as const,
            conflict: conflict.conflict
          },
          message: this.messageFrom(conflict)
        }))
      );
    }

    return from(this.markFailed(mutation, this.messageFrom(failed))).pipe(
      map(() => ({
        status: 'failed' as const,
        result: optimisticResult,
        mutation,
        message: this.messageFrom(failed)
      }))
    );
  }

  private async applySyncResponse(mutations: OfflineMutation[], response: SyncMutationsResponse): Promise<void> {
    const byId = new Map(mutations.map(mutation => [mutation.clientMutationId, mutation]));

    await Promise.all(response.applied.map(item =>
      this.db.updateMutation(item.clientMutationId, {
        status: 'applied',
        result: item.result,
        lastError: ''
      })
    ));

    await Promise.all(response.conflicts.map(item =>
      this.db.updateMutation(item.clientMutationId, {
        status: 'conflict',
        conflict: item.conflict,
        lastError: this.messageFrom(item)
      })
    ));

    const handledIds = new Set([
      ...response.applied.map(item => item.clientMutationId),
      ...response.conflicts.map(item => item.clientMutationId),
      ...response.failed.map(item => item.clientMutationId)
    ]);

    await Promise.all(response.failed.map(item =>
      this.db.updateMutation(item.clientMutationId, {
        status: 'failed',
        conflict: item.conflict,
        lastError: this.messageFrom(item)
      })
    ));

    await Promise.all([...byId.values()]
      .filter(mutation => !handledIds.has(mutation.clientMutationId))
      .map(mutation => this.db.updateMutation(mutation.clientMutationId, {
        status: 'pending',
        lastError: 'Brak odpowiedzi synchronizacji'
      })));
  }

  private sendMutations<TResponse>(mutations: OfflineMutation[], judgeToken?: string): Observable<SyncMutationsResponse<TResponse>> {
    const options = judgeToken
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${judgeToken}` }) }
      : {};

    return this.http.post<SyncMutationsResponse<TResponse>>(`${API_BASE_URL}/sync/mutations`, {
      mutations: mutations.map(mutation => ({
        clientMutationId: mutation.clientMutationId,
        type: mutation.type,
        entityId: mutation.entityId,
        baseRevision: mutation.baseRevision ?? null,
        payload: this.redactPayload(mutation.payload),
        createdAt: mutation.createdAt,
        deviceId: mutation.deviceId
      }))
    }, options);
  }

  private queue(mutation: OfflineMutation): Promise<string> {
    return this.db.putMutation(mutation).then(result => {
      this.refreshCounts();
      return result;
    });
  }

  private markFailed(mutation: OfflineMutation, message: string): Promise<string> {
    return this.db.putMutation({
      ...mutation,
      status: 'failed',
      lastError: message
    }).then(result => {
      this.refreshCounts();
      return result;
    });
  }

  private async createMutation<TPayload>(draft: MutationDraft<TPayload>): Promise<OfflineMutation<TPayload>> {
    const tokenFingerprint = draft.tokenFingerprint || (draft.token ? await this.tokenFingerprint(draft.token) : undefined);
    if (draft.token && tokenFingerprint) {
      this.judgeTokens.set(tokenFingerprint, draft.token);
    }

    return {
      clientMutationId: this.createMutationId(),
      type: draft.type,
      entityId: draft.entityId,
      tournamentId: draft.tournamentId,
      baseRevision: draft.baseRevision ?? null,
      authMode: draft.authMode,
      tokenFingerprint,
      payload: draft.payload,
      createdAt: new Date().toISOString(),
      deviceId: this.deviceId(),
      status: 'pending'
    };
  }

  private createMutationId(): string {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private deviceId(): string {
    const key = 'husaria.deviceId';
    const existing = localStorage.getItem(key);
    if (existing) return existing;

    const created = this.createMutationId();
    localStorage.setItem(key, created);
    return created;
  }

  private checkConnection(syncAfterOnline: boolean): void {
    if (!navigator.onLine) {
      this.setOnline(false);
      return;
    }

    this.http.get(`${API_BASE_URL}/ping`).pipe(
      timeout(3000),
      map(() => true),
      catchError(() => of(false))
    ).subscribe(isOnline => {
      this.setOnline(isOnline);
      if (isOnline && syncAfterOnline) this.syncPending();
    });
  }

  private setOnline(isOnline: boolean): void {
    const wasOffline = !this.onlineSubject.value;
    this.onlineSubject.next(isOnline);
    if (isOnline && wasOffline) this.syncPending();
  }

  private refreshCounts(): void {
    Promise.all([
      this.db.countByStatus(['pending', 'syncing']),
      this.db.countByStatus(['conflict'])
    ]).then(([pending, conflicts]) => {
      this.pendingCountSubject.next(pending);
      this.conflictCountSubject.next(conflicts);
    });
  }

  private isOfflineError(error: any): boolean {
    return !navigator.onLine || error?.status === 0;
  }

  private messageFrom(item?: SyncMutationResponseItem | null): string {
    const conflict = item?.conflict as any;
    return conflict?.message || 'Nie udało się zsynchronizować zmiany';
  }

  private async syncMutationGroups(mutations: OfflineMutation[]): Promise<void> {
    const normalizedMutations = await Promise.all(mutations.map(mutation => this.normalizeStoredMutation(mutation)));
    const sessionMutations = normalizedMutations.filter(mutation => mutation.authMode !== 'judge');
    const judgeMutations = normalizedMutations.filter(mutation => mutation.authMode === 'judge' && mutation.tokenFingerprint);
    const judgeGroups = new Map<string, OfflineMutation[]>();

    for (const mutation of judgeMutations) {
      const token = this.judgeTokens.get(mutation.tokenFingerprint || '');
      if (!token) continue;
      const group = judgeGroups.get(token) || [];
      group.push(mutation);
      judgeGroups.set(token, group);
    }

    const eligible = [
      ...sessionMutations,
      ...[...judgeGroups.values()].flat()
    ].map(mutation => ({
      ...mutation,
      status: 'syncing' as const
    }));

    if (!eligible.length) return;

    await Promise.all(eligible.map(mutation => this.db.putMutation(mutation)));

    const sessionSyncing = eligible.filter(mutation => mutation.authMode !== 'judge');
    if (sessionSyncing.length) {
      const response = await firstValueFrom(this.sendMutations(sessionSyncing));
      await this.applySyncResponse(sessionSyncing, response);
    }

    for (const [token, group] of judgeGroups) {
      const syncingGroup = eligible.filter(mutation => group.some(item => item.clientMutationId === mutation.clientMutationId));
      if (!syncingGroup.length) continue;
      const response = await firstValueFrom(this.sendMutations(syncingGroup, token));
      await this.applySyncResponse(syncingGroup, response);
    }
  }

  private payloadForConflictRetry(mutation: OfflineMutation): unknown | null {
    const conflict = (mutation.conflict || {}) as any;
    const payload = { ...(mutation.payload as any) };

    if (mutation.type !== 'judgeSessionResult.update') {
      return payload;
    }

    const liveState = conflict?.liveState;
    const body = payload.body || {};
    if (!liveState) return null;

    const sameParticipant = liveState.activeTournamentPlayerId === payload.activeTournamentPlayerId;
    const sameBattle = liveState.activeBattleId === body.battleId;
    if (!sameParticipant || !sameBattle) return null;

    return {
      ...payload,
      body: {
        ...body,
        liveStateVersion: liveState.version
      }
    };
  }

  private async tokenFingerprint(token: string): Promise<string> {
    const data = new TextEncoder().encode(token);
    if (crypto.subtle) {
      const digest = await crypto.subtle.digest('SHA-256', data);
      return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    }

    let hash = 0;
    for (let index = 0; index < token.length; index += 1) {
      hash = ((hash << 5) - hash + token.charCodeAt(index)) | 0;
    }
    return `fallback-${Math.abs(hash)}`;
  }

  private async normalizeStoredMutation(mutation: OfflineMutation): Promise<OfflineMutation> {
    if (mutation.type !== 'judgeSessionResult.update') {
      return mutation;
    }

    const payload = mutation.payload as any;
    if (!payload?.token) {
      return {
        ...mutation,
        authMode: 'judge'
      };
    }

    const token = String(payload.token);
    const tokenFingerprint = await this.tokenFingerprint(token);
    this.judgeTokens.set(tokenFingerprint, token);
    const { token: _token, ...safePayload } = payload;
    const normalized = {
      ...mutation,
      authMode: 'judge' as const,
      tokenFingerprint,
      payload: safePayload
    };

    await this.db.putMutation(normalized);
    return normalized;
  }

  private redactPayload(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(item => this.redactPayload(item));
    }

    if (!value || typeof value !== 'object') {
      return value;
    }

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((result, [key, item]) => {
      if (['token', 'authorization', 'password'].includes(key.toLowerCase())) {
        result[key] = '[redacted]';
        return result;
      }

      result[key] = this.redactPayload(item);
      return result;
    }, {});
  }
}
