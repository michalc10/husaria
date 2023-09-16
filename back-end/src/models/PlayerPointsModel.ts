
import { Schema, model, Document } from 'mongoose'


export interface IPlayerPoints {
    tournamentId: string;
    playerName: string,
    horse: string,
    flag: string,
    playerId: string,

    sabrePoints: string,
    sabreExtraPoints: number,
    sabreTime: number,
    sabreScore: number,

    broadswordPoints: string,
    broadswordExtraPoints: number,
    broadswordTime: number,
    broadswordScore: number,

    lancePoints: string,
    lanceExtraPoints: number,
    lanceTime: number,
    lanceScore: number,

    penalty: number,
    score: number

}

export interface IPlayerPointsModel extends IPlayerPoints, Document { }


const playerPointsSchema = new Schema(
    {
        tournamentId: { type: String, required: [true, "Please entere tournamentId"] },
        playerName: { type: String, require: true },
        horse: { type: String, require: true },
        flag: { type: String, require: true },
        playerId: { type: String, require: true },

        sabrePoints: { type: String, default: '000000000000' },
        sabreTime: { type: Number, default: 0 },
        sabreExtraPoints: { type: Number, default: 0 },
        sabreScore: { type: Number, default: 0 },

        broadswordPoints: { type: String, default: '010000000000' },
        broadswordTime: { type: Number, default: 0 },
        broadswordExtraPoints: { type: Number, default: 0 },
        broadswordScore: { type: Number, default: 0 },

        lancePoints: { type: String, default: '000000000000' },
        lanceTime: { type: Number, default: 0 },
        lanceExtraPoints: { type: Number, default: 0 },
        lanceScore: { type: Number, default: 0 },

        penalty: { type: Number, default: 0 },
        score: { type: Number, default: 0 }
    }
)

export const PlayerPoints = model<IPlayerPointsModel>('PlayerPoints', playerPointsSchema);
