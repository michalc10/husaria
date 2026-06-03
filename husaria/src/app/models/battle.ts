export interface IScoreOption {
  code: string;
  label: string;
  score: number;
}

export interface IBattleObstacle {
  _id?: string;
  categoryId?: string;
  name: string;
  order: number;
  inputType: 'toggle' | 'select';
  score: number;
  scoreRaw: string;
  scoreOptions?: IScoreOption[];
}

export interface IBattleCategory {
  _id?: string;
  battleId?: string;
  name: string;
  order: number;
  obstacles: IBattleObstacle[];
}

export interface IBattlePenalty {
  _id?: string;
  battleId?: string;
  name: string;
  order: number;
  score: number;
}

export interface IBattle {
  _id?: string;
  tournamentId?: string;
  name: string;
  order: number;
  revision?: number;
  updatedAt?: string | Date;
  categories: IBattleCategory[];
  penalties: IBattlePenalty[];
}

export interface IObstacleResult {
  _id?: string;
  obstacleId: string;
  value: string;
  score?: number;
}

export interface IPenaltyResult {
  _id?: string;
  penaltyId: string;
  selected: boolean;
  score?: number;
}

export interface IBattleResult {
  _id?: string;
  battleId: string;
  tournamentPlayerId?: string;
  extraPoints: number;
  time: number;
  score: number;
  revision?: number;
  updatedAt?: string | Date;
  obstacleResults: IObstacleResult[];
  penaltyResults: IPenaltyResult[];
}
