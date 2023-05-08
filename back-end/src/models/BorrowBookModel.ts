// const mongoose = require('mongoose')
import { Schema, model, Document } from 'mongoose'




export interface IBorrowBooks {
    bookId: string,
    bookTitle: string,
    userId: string,
    dateOut: Date,
    dateIn: Date,
    status: boolean
}

export interface IBorrowBooksModel extends IBorrowBooks, Document { }


const borrowBooksSchema = new Schema(
    {
        bookId: { type: String, required: true, default: "-1" },
        bookTitle: { type: String, required: [true, "Please entere a bookTitle"] },
        userId: { type: String, required: true, default: "" },
        dateOut: { type: Date, required: true, default: new Date() },
        dateIn: { type: Date, required: true, default: new Date() },
        status: { type: Boolean, required: true, default: true }
    },
    {
        timestamps: true
    }
)

export default  model<IBorrowBooksModel>('BorrowBook', borrowBooksSchema);
// export const Book = model<IBookModel>('Book', bookSchema);
