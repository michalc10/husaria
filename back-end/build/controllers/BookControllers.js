"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BookModel_1 = require("../models/BookModel");
const node_fs_1 = require("node:fs");
const mongoose_1 = __importDefault(require("mongoose"));
const createBook = (req, res, next) => {
    const { title, author, category, ISBN, addedDate, borrowBook, rating } = req.body;
    const book = new BookModel_1.Book({
        _id: new mongoose_1.default.Types.ObjectId(),
        title: title,
        author: author,
        category: category,
        ISBN: ISBN,
        addedDate: addedDate,
        borrowBook: borrowBook,
        rating: rating
    });
    if (req.file) {
        book.picture = req.file.path;
    }
    return book
        .save()
        .then((book) => res.status(201).json(book))
        .catch((err) => res.status(500).json({ err }));
};
const readBook = (req, res, next) => {
    const bookId = req.params.bookId;
    return BookModel_1.Book.findById(bookId)
        .then((book) => book
        ? res.status(200).json(book)
        : res.status(404).json({ message: "Not found" }))
        .catch((err) => res.status(500).json({ err }));
};
const readAll = (req, res, next) => {
    return BookModel_1.Book.find()
        .then((books) => res.status(200).json(books))
        .catch((error) => res.status(500).json({ error }));
};
const updateBook = (req, res, next) => {
    const bookId = req.params.bookId;
    const { title, author, category, ISBN, addedDate, borrowBook, rating } = req.body;
    console.log(req.body);
    return BookModel_1.Book.findById(bookId)
        .then((book) => {
        if (book) {
            book.set(req.body);
            if (req.file) {
                if (book.picture) {
                    (0, node_fs_1.unlink)(`${book.picture}`, (err) => {
                        if (err)
                            throw err;
                        console.log(`${book.picture} was deleted`);
                    });
                }
                book.picture = req.file.path;
            }
            return book
                .save()
                .then((book) => res.status(201).json(book))
                .catch((err) => res.status(500).json({ err }));
        }
        else {
            res.status(404).json({ message: "Not found" });
        }
    })
        .catch((err) => res.status(500).json({ err }));
};
const deleteBook = (req, res, next) => {
    const bookId = req.params.bookId;
    return BookModel_1.Book.findByIdAndDelete(bookId)
        .then((book) => {
        if (book === null || book === void 0 ? void 0 : book.picture) {
            (0, node_fs_1.unlink)(`${book.picture}`, (err) => {
                if (err)
                    throw err;
                console.log(`${book.picture} was deleted`);
            });
        }
        book
            ? res.status(200).json({ message: "deleted" })
            : res.status(404).json({ message: "Not found" });
    })
        .catch((err) => res.status(500).json({ err }));
};
const getPicture = (req, res, next) => {
    const path = req.params['file'];
    return res.sendFile(path, { root: './src/public/images/' });
};
exports.default = { createBook, readAll, readBook, updateBook, deleteBook, getPicture };
