import { IBattle, IBattleCategory, IBattleResult } from './battle';

export interface IBattleLiveState {
  battleId: string;
  activeTournamentPlayerId: string | null;
  version: number;
  updatedAt?: string | Date | null;
  activeParticipant?: {
    _id: string;
    playerName: string;
    horse: string;
    order: number;
  } | null;
}

export interface ITournamentLiveState {
  tournamentId: string;
  activeTournamentPlayerId: string | null;
  activeBattleId: string | null;
  version: number;
  updatedAt?: string | Date | null;
  activeParticipant?: {
    _id: string;
    playerName: string;
    horse: string;
    order: number;
  } | null;
  activeBattle?: {
    _id: string;
    name: string;
    order: number;
  } | null;
}

export interface IJudgeStation {
  _id: string;
  tournamentId: string;
  battleId?: string;
  categoryId?: string;
  assignments?: IJudgeStationAssignment[];
  battleIds?: string[];
  battles?: Array<Pick<IBattle, '_id' | 'tournamentId' | 'name' | 'order'>>;
  label: string;
  revokedAt?: string | Date | null;
  createdAt?: string | Date;
  lastSeenAt?: string | Date | null;
  guestUrl?: string;
}

export interface IJudgeStationAssignment {
  battleId: string;
  categoryId: string;
  battleName?: string;
  battleOrder?: number;
  categoryName?: string;
  categoryOrder?: number;
}

export interface IJudgeStationCategory {
  category: IBattleCategory;
  station: IJudgeStation | null;
}

export interface IJudgeStationList {
  battleId: string;
  categories: IJudgeStationCategory[];
}

export interface IJudgeStationTournamentList {
  tournamentId: string;
  battles: IBattle[];
  stations: IJudgeStation[];
}

export interface IJudgeSession {
  station: IJudgeStation;
  battles: IBattle[];
  liveState: ITournamentLiveState;
  results: IBattleResult[];
  battle?: {
    _id: string;
    tournamentId: string;
    name: string;
    order: number;
  };
  category?: IBattleCategory;
  result?: IBattleResult | null;
}

export interface IJudgeCategoryResultPayload {
  battleId: string;
  liveStateVersion: number;
  obstacleResults: Array<{
    obstacleId: string;
    value: string;
  }>;
}
