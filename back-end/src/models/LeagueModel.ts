import { Schema, model, Document } from 'mongoose'


export interface ILeague {
    year: string;
    name: string;
}

export interface ILeagueModel extends ILeague, Document { }


const LeagueSchema = new Schema(
    {
        name: { type: String, required: [true, "Please entere a name"] },
        year: { type: String, required: [true, "Please entere a year"] },
    }
)

export const League = model<ILeagueModel>('League', LeagueSchema);
