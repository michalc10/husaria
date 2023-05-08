import { Schema, model, Document } from 'mongoose';


export interface IBookDetails  {
    idBook: string,
    username: string,
    comment: string
}
export interface IBookDetailsModel extends IBookDetails, Document { }

const bookDetailsSchema = new Schema({
    idBook: { type: String, required: true, default: '-1' },
    username: { type: String, required: true,default: "Please entere a username" },
    comment: { type: String, required: true }
})

export const BookDetails = model<IBookDetailsModel>('BookDetails',bookDetailsSchema)

