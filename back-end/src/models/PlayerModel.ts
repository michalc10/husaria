import { Schema, model, Document } from 'mongoose'


export interface IPlayer {
    name:string,
    horse: string,
    flag: string,
    
}

export interface IPlayerModel extends IPlayer, Document { }


const playerSchema = new Schema(
    {
        name: { type: String, required: [true, "Please entere a name"] },
        horse: { type: String, required: [true, "Please entere a horse name"] },
        flag: { type: String, required: [true, "Please entere a flag"] }
    }
)

export const Player = model<IPlayerModel>('Player', playerSchema);
