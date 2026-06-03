import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { Subscription } from 'rxjs';
import { IBattle, IBattleObstacle, IBattleResult } from 'src/app/models/battle';
import { IJudgeSession } from 'src/app/models/judgeStation';
import { OfflineSyncService } from '../offline/offline-sync.service';
import { JudgeStationService } from '../turnament/services/judge-station/judge-station.service';
import { LiveScoreSocketService } from '../turnament/services/live-score-socket/live-score-socket.service';

@Component({
  selector: 'app-judge-mobile',
  templateUrl: './judge-mobile.component.html',
  styleUrls: ['./judge-mobile.component.scss'],
  standalone: false
})
export class JudgeMobileComponent implements OnInit, OnDestroy {
  token = '';
  session?: IJudgeSession;
  connected = false;
  revoked = false;
  loading = true;
  savingBattleId = '';
  statusMessage = '';

  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private judgeStationService: JudgeStationService,
    private liveScoreSocket: LiveScoreSocketService,
    private offlineSync: OfflineSyncService,
    private transloco: TranslocoService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.loadSession();
    this.liveScoreSocket.joinStation(this.token);

    this.subscription.add(this.liveScoreSocket.connected$.subscribe(connected => (this.connected = connected)));
    this.subscription.add(
      this.liveScoreSocket.tournamentLiveState$.subscribe(state => {
        if (this.session && state.tournamentId === this.session.station.tournamentId) {
          this.session = {
            ...this.session,
            liveState: state,
            results: []
          };
          this.loadSession(false);
        }
      })
    );
    this.subscription.add(
      this.liveScoreSocket.battleResult$.subscribe(result => {
        if (
          this.session &&
          this.session.battles.some(battle => battle._id === result.battleId) &&
          result.tournamentPlayerId === this.session.liveState.activeTournamentPlayerId
        ) {
          this.applyResult(result);
        }
      })
    );
    this.subscription.add(
      this.liveScoreSocket.stationRevoked$.subscribe(() => {
        this.revoked = true;
        this.statusMessage = this.transloco.translate('judgeMobile.revoked');
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.liveScoreSocket.disconnect();
  }

  loadSession(showLoader = true): void {
    if (showLoader) this.loading = true;

    this.judgeStationService.getSession(this.token).subscribe({
      next: session => {
        this.session = session;
        this.revoked = false;
        this.loading = false;
        this.offlineSync.cacheJudgeSession(this.token, session).subscribe(() => this.offlineSync.syncPending());
      },
      error: error => {
        if (error?.status === 0) {
          this.offlineSync.cachedJudgeSession<IJudgeSession>(this.token).subscribe(cachedSession => {
            this.loading = false;
            if (cachedSession) {
              this.session = cachedSession;
              this.revoked = false;
              this.statusMessage = this.transloco.translate('judgeMobile.offlineCached');
              return;
            }

            this.revoked = true;
            this.statusMessage = this.transloco.translate('judgeMobile.offlineNoCache');
          });
          return;
        }

        this.loading = false;
        this.revoked = true;
        this.statusMessage = this.transloco.translate('judgeMobile.invalidLink');
      }
    });
  }

  getBattleResult(battle: IBattle): IBattleResult | undefined {
    return this.session?.results.find(result => result.battleId === battle._id);
  }

  getObstacleValue(battle: IBattle, obstacle: IBattleObstacle): string {
    const obstacleId = obstacle._id;
    if (!obstacleId) return '0';
    return this.getBattleResult(battle)?.obstacleResults.find(result => result.obstacleId === obstacleId)?.value || '0';
  }

  setToggleObstacle(battle: IBattle, obstacle: IBattleObstacle): void {
    const nextValue = this.getObstacleValue(battle, obstacle) === '1' ? '0' : '1';
    this.saveObstacle(battle, obstacle, nextValue);
  }

  setSelectObstacle(battle: IBattle, obstacle: IBattleObstacle, value: string): void {
    this.saveObstacle(battle, obstacle, value || '0');
  }

  isSelectObstacle(obstacle: IBattleObstacle): boolean {
    return obstacle.inputType === 'select';
  }

  optionLabel(obstacle: IBattleObstacle, value: string): string {
    return obstacle.scoreOptions?.find(option => option.code === value)?.label || value;
  }

  isSavingBattle(battle: IBattle): boolean {
    return !!battle._id && this.savingBattleId === battle._id;
  }

  private saveObstacle(battle: IBattle, obstacle: IBattleObstacle, value: string): void {
    if (!this.session?.liveState.activeTournamentPlayerId || !battle._id || !obstacle._id) return;

    this.savingBattleId = battle._id;
    const currentResult = this.getBattleResult(battle);
    const values = new Map((currentResult?.obstacleResults || []).map(result => [result.obstacleId, result.value]));
    values.set(obstacle._id, value);
    const body = {
      battleId: battle._id,
      liveStateVersion: this.session.liveState.version,
      obstacleResults: battle.categories.flatMap(category =>
        category.obstacles
          .filter(item => !!item._id)
          .map(item => ({
            obstacleId: item._id!,
            value: values.get(item._id!) || '0'
          }))
      )
    };
    const optimisticResult = this.optimisticResult(battle, body.obstacleResults);
    this.applyResult(optimisticResult);

    this.offlineSync.mutate<IBattleResult>({
      type: 'judgeSessionResult.update',
      entityId: `${this.session.station._id}:${battle._id}`,
      tournamentId: this.session.station.tournamentId,
      baseRevision: currentResult?.revision || 0,
      authMode: 'judge',
      token: this.token,
      payload: {
        stationId: this.session.station._id,
        body,
        activeTournamentPlayerId: this.session.liveState.activeTournamentPlayerId,
        activeBattleId: this.session.liveState.activeBattleId
      }
    }, optimisticResult).subscribe({
      next: outcome => {
        if (outcome.result) {
          this.applyResult(outcome.result);
        }
        this.savingBattleId = '';
        this.statusMessage = outcome.status === 'queued'
          ? this.transloco.translate('offline.queued')
          : outcome.status === 'conflict'
            ? this.transloco.translate('judgeMobile.conflict')
            : this.transloco.translate('offline.saved');
      },
      error: error => {
        this.savingBattleId = '';
        this.statusMessage = error?.status === 409
          ? this.transloco.translate('judgeMobile.staleLiveState')
          : this.transloco.translate('judgeMobile.saveError');
        this.loadSession(false);
      }
    });
  }

  private optimisticResult(
    battle: IBattle,
    obstacleResults: Array<{ obstacleId: string; value: string }>
  ): IBattleResult {
    const currentResult = this.getBattleResult(battle);
    const scoredObstacleResults = obstacleResults.map(result => ({
      ...result,
      score: this.optimisticObstacleScore(battle, result.obstacleId, result.value)
    }));

    return {
      _id: currentResult?._id,
      battleId: battle._id!,
      tournamentPlayerId: this.session?.liveState.activeTournamentPlayerId || undefined,
      extraPoints: currentResult?.extraPoints || 0,
      time: currentResult?.time || 0,
      score: scoredObstacleResults.reduce((total, result) => total + (result.score || 0), 0) +
        (currentResult?.extraPoints || 0) +
        (currentResult?.time || 0) +
        (currentResult?.penaltyResults || []).reduce((total, result) => total + (result.score || 0), 0),
      revision: currentResult?.revision || 0,
      obstacleResults: scoredObstacleResults,
      penaltyResults: currentResult?.penaltyResults || []
    };
  }

  private optimisticObstacleScore(battle: IBattle, obstacleId: string, value: string): number {
    const obstacle = battle.categories.flatMap(category => category.obstacles).find(item => item._id === obstacleId);
    if (!obstacle) return 0;

    if (this.isSelectObstacle(obstacle)) {
      return obstacle.scoreOptions?.find(option => option.code === value)?.score || 0;
    }

    return value === '1' ? Number(obstacle.score || 0) : 0;
  }

  private applyResult(result: IBattleResult): void {
    if (!this.session) return;

    const results = [...(this.session.results || [])];
    const index = results.findIndex(item => item.battleId === result.battleId);
    if (index >= 0) {
      results[index] = result;
    } else {
      results.push(result);
    }

    this.session = {
      ...this.session,
      results
    };
  }
}
