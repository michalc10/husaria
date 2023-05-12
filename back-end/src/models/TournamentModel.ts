import { Schema, model, Document } from 'mongoose'


export interface ITournament {
    leagueId:string;
    city:string;
    date:Date;
    
}

export interface ITournamentModel extends ITournament, Document { }


const tournamentSchema = new Schema(
    {
        leagueId: { type: String, required: [true, "Please entere leagueId"] },
        city: { type: String, required: [true, "Please entere a city"] },
        date: { type: Date, required: true, default: new Date() }
    }
)

export const Tournament = model<ITournamentModel>('Tournament', tournamentSchema);
