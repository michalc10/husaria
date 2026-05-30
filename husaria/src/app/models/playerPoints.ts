import { IBattleResult } from './battle';

export interface IPlayerPoints {
    _id?: string;
    tournamentId: string;
    playerName: string;
    horse: string;
    bannerId?: string | null;
    bannerName?: string;
    bannerCity?: string;
    flag?: string;
    playerId: string;

    battleResults: IBattleResult[];
    totalScore: number;
    score?: number; 
    order?: number;

    [key: string]: any; 
}
