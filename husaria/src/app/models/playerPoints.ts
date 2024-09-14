export interface IPlayerPoints {
    _id?: string;
    tournamentId: string;
    playerName: string;
    horse: string;
    flag: string;
    playerId: string;

    battle_1_points: string;
    battle_1_extraPoints: number;
    battle_1_time: number;
    battle_1_score: number;

    battle_2_points: string;
    battle_2_extraPoints: number;
    battle_2_time: number;
    battle_2_score: number;

    battle_3_points: string;
    battle_3_extraPoints: number;
    battle_3_time: number;
    battle_3_score: number;

    battle_4_points?: string;
    battle_4_extraPoints?: number;
    battle_4_time?: number;
    battle_4_score?: number;

    battle_5_points?: string;
    battle_5_extraPoints?: number;
    battle_5_time?: number;
    battle_5_score?: number;

    penalty: number;
    score: number; 

    [key: string]: any; 
}
