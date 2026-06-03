import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { IBattleResult } from 'src/app/models/battle';
import { IBattleLiveState, ITournamentLiveState } from 'src/app/models/judgeStation';
import { API_BASE_URL } from 'src/app/globals';

export interface IStationPresence {
  stationId: string;
  online: boolean;
  lastSeenAt?: string | Date | null;
}

export interface IStationResultSaved {
  stationId: string;
  stationLabel?: string;
  battleId: string;
  tournamentPlayerId?: string;
  savedAt?: string | Date;
}

@Injectable({ providedIn: 'root' })
export class LiveScoreSocketService {
  private socket?: Socket;
  private liveStateSubject = new Subject<IBattleLiveState>();
  private tournamentLiveStateSubject = new Subject<ITournamentLiveState>();
  private battleResultSubject = new Subject<IBattleResult>();
  private stationPresenceSubject = new Subject<IStationPresence>();
  private stationResultSavedSubject = new Subject<IStationResultSaved>();
  private stationRevokedSubject = new Subject<{ stationId?: string } | void>();
  private connectedSubject = new Subject<boolean>();

  liveState$ = this.liveStateSubject.asObservable();
  tournamentLiveState$ = this.tournamentLiveStateSubject.asObservable();
  battleResult$ = this.battleResultSubject.asObservable();
  stationPresence$ = this.stationPresenceSubject.asObservable();
  stationResultSaved$ = this.stationResultSavedSubject.asObservable();
  stationRevoked$ = this.stationRevokedSubject.asObservable();
  connected$ = this.connectedSubject.asObservable();

  connect(): void {
    if (this.socket?.connected || this.socket?.active) return;

    this.socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => this.connectedSubject.next(true));
    this.socket.on('disconnect', () => this.connectedSubject.next(false));
    this.socket.on('liveState.updated', (state: IBattleLiveState) => this.liveStateSubject.next(state));
    this.socket.on('tournamentLiveState.updated', (state: ITournamentLiveState) => this.tournamentLiveStateSubject.next(state));
    this.socket.on('battleResult.updated', (result: IBattleResult) => this.battleResultSubject.next(result));
    this.socket.on('station.presence', (presence: IStationPresence) => this.stationPresenceSubject.next(presence));
    this.socket.on('station.resultSaved', (payload: IStationResultSaved) => this.stationResultSavedSubject.next(payload));
    this.socket.on('station.revoked', (payload?: { stationId?: string }) => this.stationRevokedSubject.next(payload));
  }

  joinBattle(battleId: string): void {
    this.connect();
    this.socket?.emit('battle.join', { battleId });
  }

  joinTournament(tournamentId: string): void {
    this.connect();
    this.socket?.emit('tournament.join', { tournamentId });
  }

  joinStation(token: string): void {
    this.connect();
    this.socket?.emit('station.join', { token });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
  }
}
