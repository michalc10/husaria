"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BookDetailsModel_1 = require("../models/BookDetailsModel");
const mongoose_1 = __importDefault(require("mongoose"));
const createBookDetails = (req, res, next) => {
    const { idBook, username, comment } = req.body;
    const bookDetails = new BookDetailsModel_1.BookDetails({
        _id: new mongoose_1.default.Types.ObjectId(),
        idBook: idBook,
        username: username,
        comment: comment
    });
    return bookDetails
        .save()
        .then((bookDetails) => res.status(201).json(bookDetails))
        .catch((err) => res.status(500).json({ err }));
};
const readBookDetails = (req, res, next) => {
    const bookDetailsId = req.params.bookDetailsId;
    return BookDetailsModel_1.BookDetails.findById(bookDetailsId)
        .then((bookDetails) => bookDetails
        ? res.status(200).json({ bookDetails })
        : res.status(404).json({ message: "Not found" }))
        .catch((err) => res.status(500).json({ err }));
};
const readAll = (req, res, next) => {
    return BookDetailsModel_1.BookDetails.find()
        .then((bookDetailss) => res.status(200).json(bookDetailss))
        .catch((error) => res.status(500).json({ error }));
};
const updateBookDetails = (req, res, next) => {
    const bookDetailsId = req.params.bookDetailsId;
    return BookDetailsModel_1.BookDetails.findById(bookDetailsId)
        .then((bookDetails) => {
        if (bookDetails) {
            bookDetails.set(req.body);
            return bookDetails
                .save()
                .then((bookDetails) => res.status(201).json({ bookDetails }))
                .catch((err) => res.status(500).json({ err }));
        }
        else {
            res.status(404).json({ message: "Not found" });
        }
    })
        .catch((err) => res.status(500).json({ err }));
};
const deleteBookDetails = (req, res, next) => {
    const bookDetailsId = req.params.bookDetailsId;
    return BookDetailsModel_1.BookDetails.findByIdAndDelete(bookDetailsId)
        .then((bookDetails) => bookDetails
        ? res.status(200).json({ message: "deleted" })
        : res.status(404).json({ message: "Not found" }))
        .catch((err) => res.status(500).json({ err }));
};
exports.default = { createBookDetails, readAll, readBookDetails, updateBookDetails, deleteBookDetails };
