import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IBattleResult } from 'src/app/models/battle';
import {
  IBattleLiveState,
  IJudgeCategoryResultPayload,
  IJudgeSession,
  IJudgeStationAssignment,
  IJudgeStation,
  IJudgeStationList,
  IJudgeStationTournamentList,
  ITournamentLiveState
} from 'src/app/models/judgeStation';
import { API_BASE_URL } from 'src/app/globals';
import { CrudService } from 'src/app/shered/service/crud.service';

export interface IJudgeStationPayload {
  label?: string;
  assignments: IJudgeStationAssignment[];
  battleIds?: string[];
}

export interface ITournamentLiveStatePayload {
  activeTournamentPlayerId?: string | null;
  activeBattleId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class JudgeStationService {
  constructor(
    private crud: CrudService,
    private http: HttpClient
  ) {}

  listForBattle(battleId: string): Observable<IJudgeStationList> {
    return this.crud.read<IJudgeStationList>('judge-station/battle', battleId);
  }

  createOrRegenerate(battleId: string, categoryId: string): Observable<IJudgeStation> {
    return this.http.post<IJudgeStation>(
      `${API_BASE_URL}/judge-station/battle/${encodeURIComponent(battleId)}/category/${encodeURIComponent(categoryId)}`,
      {}
    );
  }

  revoke(stationId: string): Observable<IJudgeStation> {
    return this.http.delete<IJudgeStation>(`${API_BASE_URL}/judge-station/${encodeURIComponent(stationId)}`);
  }

  listForTournament(tournamentId: string): Observable<IJudgeStationTournamentList> {
    return this.http.get<IJudgeStationTournamentList>(`${API_BASE_URL}/judge-station/tournament/${encodeURIComponent(tournamentId)}`);
  }

  create(tournamentId: string, payload: IJudgeStationPayload): Observable<IJudgeStation> {
    return this.http.post<IJudgeStation>(
      `${API_BASE_URL}/judge-station/tournament/${encodeURIComponent(tournamentId)}`,
      payload
    );
  }

  update(stationId: string, payload: Partial<IJudgeStationPayload>): Observable<IJudgeStation> {
    return this.http.put<IJudgeStation>(`${API_BASE_URL}/judge-station/${encodeURIComponent(stationId)}`, payload);
  }

  regenerateToken(stationId: string): Observable<IJudgeStation> {
    return this.http.post<IJudgeStation>(
      `${API_BASE_URL}/judge-station/${encodeURIComponent(stationId)}/regenerate-token`,
      {}
    );
  }

  getLiveState(battleId: string): Observable<IBattleLiveState> {
    return this.http.get<IBattleLiveState>(`${API_BASE_URL}/battle/${encodeURIComponent(battleId)}/live-state`);
  }

  updateLiveState(battleId: string, activeTournamentPlayerId: string | null): Observable<IBattleLiveState> {
    return this.http.put<IBattleLiveState>(`${API_BASE_URL}/battle/${encodeURIComponent(battleId)}/live-state`, {
      activeTournamentPlayerId
    });
  }

  getTournamentLiveState(tournamentId: string): Observable<ITournamentLiveState> {
    return this.http.get<ITournamentLiveState>(`${API_BASE_URL}/tournament/${encodeURIComponent(tournamentId)}/live-state`);
  }

  updateTournamentLiveState(
    tournamentId: string,
    payload: ITournamentLiveStatePayload
  ): Observable<ITournamentLiveState> {
    return this.http.put<ITournamentLiveState>(
      `${API_BASE_URL}/tournament/${encodeURIComponent(tournamentId)}/live-state`,
      payload
    );
  }

  getSession(token: string): Observable<IJudgeSession> {
    return this.http.get<IJudgeSession>(`${API_BASE_URL}/judge-station/session`, {
      headers: this.authHeaders(token)
    });
  }

  updateSessionResult(token: string, payload: IJudgeCategoryResultPayload): Observable<IBattleResult> {
    return this.http.put<IBattleResult>(`${API_BASE_URL}/judge-station/session/result`, payload, {
      headers: this.authHeaders(token)
    });
  }

  private authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
