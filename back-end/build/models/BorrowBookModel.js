"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// const mongoose = require('mongoose')
const mongoose_1 = require("mongoose");
const borrowBooksSchema = new mongoose_1.Schema({
    bookId: { type: String, required: true, default: "-1" },
    bookTitle: { type: String, required: [true, "Please entere a bookTitle"] },
    userId: { type: String, required: true, default: "" },
    dateOut: { type: Date, required: true, default: new Date() },
    dateIn: { type: Date, required: true, default: new Date() },
    status: { type: Boolean, required: true, default: true }
}, {
    timestamps: true
});
exports.default = (0, mongoose_1.model)('BorrowBook', borrowBooksSchema);
// export const Book = model<IBookModel>('Book', bookSchema);
