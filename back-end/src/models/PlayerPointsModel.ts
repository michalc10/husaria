
import { Schema, model, Document } from 'mongoose'


export interface IPlayerPoints {
    leagueId: string;
    playerName: string,
    horse: string,
    flag: string,
    playerId: string,
    sabreP1: string,
    sabreP2: string,
    sabreP3: string,
    sabreP4: string,
    sabreP5: string,
    sabreTime: number,
    broadswordP1: string,
    broadswordP2: string,
    broadswordP3: string,
    broadswordP4: string,
    broadswordP5: string,
    broadswordTime: number,
    lanceP1: string,
    lanceP2: string,
    lanceP3: string,
    lanceP4: string,
    lanceP5: string,
    lanceTime: number,
    score: number

}

export interface IPlayerPointsModel extends IPlayerPoints, Document { }


const playerPointsSchema = new Schema(
    {
        leagueId: { type: String, required: [true, "Please entere leagueId"] },
        playerName: { type: String, require: true },
        horse: { type: String, require: true },
        flag: { type: String, require: true },
        playerId: { type: String, require: true },

        sabreP1: { type: String, default: '0' },
        sabreP2: { type: String, default: '0' },
        sabreP3: { type: String, default: '000' },
        sabreP4: { type: String, default: '000' },
        sabreP5: { type: String, default: '0' },
        saberPenalty: { type: String, default: '000' },
        sabreTime: { type: Number, default: 0 },

        broadswordP1: { type: String, default: '0' },
        broadswordP2: { type: String, default: '1000' },
        broadswordP3: { type: String, default: '000' },
        broadswordP4: { type: String, default: '000' },
        broadswordP5: { type: String, default: '0' },
        broadswordPenalty: { type: String, default: '000' },
        broadswordTime: { type: Number, default: 0 },

        lanceP1: { type: String, default: '0' },
        lanceP2: { type: String, default: '0' },
        lanceP3: { type: String, default: '000' },
        lanceP4: { type: String, default: '000' },
        lanceP5: { type: String, default: '0' },
        lancePenalty: { type: String, default: '000' },
        lanceTime: { type: Number, default: 0 },

        penalty: { type: Number, default: 0 },
        score: { type: Number, default: 0 }
    }
)

export const PlayerPoints = model<IPlayerPointsModel>('PlayerPoints', playerPointsSchema);
