"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Book = void 0;
// const mongoose = require('mongoose')
const mongoose_1 = require("mongoose");
const bookSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true
});
exports.Book = (0, mongoose_1.model)('Book', bookSchema);
