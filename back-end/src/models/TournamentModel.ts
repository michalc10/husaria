import { Schema, model, Document } from 'mongoose';

export interface ITournament {
    leagueId: string;
    city: string;
    date: Date;
    battle_1: string;
    battle_2: string;
    battle_3: string;
    battle_4: string;
    battle_5: string;
}

export interface ITournamentModel extends ITournament, Document { }

const tournamentSchema = new Schema(
    {
        leagueId: { type: String, required: [true, "Please enter leagueId"] },
        city: { type: String },
        date: { type: Date, required: true, default: new Date() },
        battle_1: { type: String, required: false },
        battle_2: { type: String, required: false },
        battle_3: { type: String, required: false },
        battle_4: { type: String, required: false },
        battle_5: { type: String, required: false }
    }
);

export const Tournament = model<ITournamentModel>('Tournament', tournamentSchema);
