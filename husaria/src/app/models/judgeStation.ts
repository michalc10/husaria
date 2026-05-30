import { IBattleCategory, IBattleResult } from './battle';

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

export interface IJudgeStation {
  _id: string;
  tournamentId: string;
  battleId: string;
  categoryId: string;
  label: string;
  revokedAt?: string | Date | null;
  createdAt?: string | Date;
  lastSeenAt?: string | Date | null;
  guestUrl?: string;
}

export interface IJudgeStationCategory {
  category: IBattleCategory;
  station: IJudgeStation | null;
}

export interface IJudgeStationList {
  battleId: string;
  categories: IJudgeStationCategory[];
}

export interface IJudgeSession {
  station: IJudgeStation;
  battle: {
    _id: string;
    tournamentId: string;
    name: string;
    order: number;
  };
  category: IBattleCategory;
  liveState: IBattleLiveState;
  result: IBattleResult | null;
}

export interface IJudgeCategoryResultPayload {
  liveStateVersion: number;
  obstacleResults: Array<{
    obstacleId: string;
    value: string;
  }>;
}
