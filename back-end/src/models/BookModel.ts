// const mongoose = require('mongoose')
import { Schema, model, Document } from 'mongoose'


export interface IBorrowBook {
    userId: string,
    date: Date,
    status: boolean
}

export interface IBook {
    title: string,
    author: string,
    category: string,
    ISBN: Number,
    addedDate: Date,
    borrowBook: IBorrowBook,
    rating: Number,
    picture: String
}

export interface IBookModel extends IBook, Document { }


const bookSchema = new Schema(
    {
        title: { type: String, required: [true, "Please entere a title"] },
        author: { type: String, required: [true, "Please entere a author"] },
        category: { type: String, required: [true, "Please entere a category"] },
        ISBN: { type: Number, required: true, default: -1 },
        addedDate: { type: Date, required: true, default: new Date() },
        borrowBook: {
            userId: { type: String, required: true, default: -1 },
            date: { type: Date, required: true, default: new Date() },
            status: { type: Boolean, required: true, default: false },
        },
        rating: { type: Number, required: true, default: 0 },
        picture: { type: String, require: true }
    },
    {
        timestamps: true
    }
)

export const Book = model<IBookModel>('Book', bookSchema);
