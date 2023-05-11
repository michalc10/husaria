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
        // ISBN: { type: Number, required: true, default: -1 },
        // addedDate: { type: Date, required: true, default: new Date() },
        // borrowBook: {
        //     userId: { type: String, required: true, default: -1 },
        //     date: { type: Date, required: true, default: new Date() },
        //     status: { type: Boolean, required: true, default: false },
        // },
        // rating: { type: Number, required: true, default: 0 },
        // picture: { type: String, require: true }
    }
)

export const Player = model<IPlayerModel>('Player', playerSchema);
