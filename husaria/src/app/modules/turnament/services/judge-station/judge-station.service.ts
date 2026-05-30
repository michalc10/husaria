import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IBattleResult } from 'src/app/models/battle';
import {
  IBattleLiveState,
  IJudgeCategoryResultPayload,
  IJudgeSession,
  IJudgeStation,
  IJudgeStationList
} from 'src/app/models/judgeStation';
import { API_BASE_URL } from 'src/app/globals';
import { CrudService } from 'src/app/shered/service/crud.service';

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

  getLiveState(battleId: string): Observable<IBattleLiveState> {
    return this.http.get<IBattleLiveState>(`${API_BASE_URL}/battle/${encodeURIComponent(battleId)}/live-state`);
  }

  updateLiveState(battleId: string, activeTournamentPlayerId: string | null): Observable<IBattleLiveState> {
    return this.http.put<IBattleLiveState>(`${API_BASE_URL}/battle/${encodeURIComponent(battleId)}/live-state`, {
      activeTournamentPlayerId
    });
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
