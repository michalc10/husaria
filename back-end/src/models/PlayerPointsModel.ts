import { Schema, model, Document } from 'mongoose';

export interface IPlayerPoints {
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
}

export interface IPlayerPointsModel extends IPlayerPoints, Document { }

const playerPointsSchema = new Schema(
    {
        tournamentId: { type: String, required: [true, "Please enter tournamentId"] },
        playerName: { type: String, required: true },
        horse: { type: String, required: true },
        flag: { type: String, required: true },
        playerId: { type: String, required: true },

        battle_1_points: { type: String, default: '0'},
        battle_1_extraPoints: { type: Number, default: 0 },
        battle_1_time: { type: Number, default: 0 },
        battle_1_score: { type: Number, default: 0 },

        battle_2_points: { type: String, default: '0' },
        battle_2_extraPoints: { type: Number, default: 0 },
        battle_2_time: { type: Number, default: 0 },
        battle_2_score: { type: Number, default: 0 },

        battle_3_points: { type: String, default: '0' },
        battle_3_extraPoints: { type: Number, default: 0 },
        battle_3_time: { type: Number, default: 0 },
        battle_3_score: { type: Number, default: 0 },

        battle_4_points: { type: String, default: '0', required: false },
        battle_4_extraPoints: { type: Number, default: 0, required: false },
        battle_4_time: { type: Number, default: 0, required: false },
        battle_4_score: { type: Number, default: 0, required: false },

        battle_5_points: { type: String, default: '0', required: false },
        battle_5_extraPoints: { type: Number, default: 0, required: false },
        battle_5_time: { type: Number, default: 0, required: false },
        battle_5_score: { type: Number, default: 0, required: false },

        penalty: { type: Number, default: 0 },
        score: { type: Number, default: 0 }
    }
);

export const PlayerPoints = model<IPlayerPointsModel>('PlayerPoints', playerPointsSchema);
