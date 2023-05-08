"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BorrowBookModel_1 = __importDefault(require("../models/BorrowBookModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const createBorrowBook = (req, res, next) => {
    const { bookId, bookTitle, userId, dateOut, dateIn, status } = req.body;
    const borrowBook = new BorrowBookModel_1.default({
        _id: new mongoose_1.default.Types.ObjectId(),
        bookId: bookId,
        bookTitle: bookTitle,
        userId: userId,
        dateOut: dateOut,
        dateIn: dateIn,
        status: status
    });
    return borrowBook
        .save()
        .then((borrowBook) => res.status(201).json(borrowBook))
        .catch((err) => res.status(500).json({ err }));
};
const readBorrowBook = (req, res, next) => {
    const borrowBookId = req.params.borrowBookId;
    return BorrowBookModel_1.default.findById(borrowBookId)
        .then((borrowBook) => borrowBook
        ? res.status(200).json({ borrowBook })
        : res.status(404).json({ message: "Not found" }))
        .catch((err) => res.status(500).json({ err }));
};
const readAll = (req, res, next) => {
    return BorrowBookModel_1.default.find()
        .then((borrowBooks) => res.status(200).json(borrowBooks))
        .catch((error) => res.status(500).json({ error }));
};
const updateBorrowBook = (req, res, next) => {
    const borrowBookId = req.params.borrowBookId;
    return BorrowBookModel_1.default.findById(borrowBookId)
        .then((borrowBook) => {
        if (borrowBook) {
            borrowBook.set(req.body);
            return borrowBook
                .save()
                .then((borrowBook) => res.status(201).json(borrowBook))
                .catch((err) => res.status(500).json({ err }));
        }
        else {
            res.status(404).json({ message: "Not found" });
        }
    })
        .catch((err) => res.status(500).json({ err }));
};
const deleteBorrowBook = (req, res, next) => {
    const borrowBookId = req.params._id;
    return BorrowBookModel_1.default.findByIdAndDelete(borrowBookId)
        .then((borrowBook) => borrowBook
        ? res.status(200).json({ message: "deleted" })
        : res.status(404).json({ message: "Not found" }))
        .catch((err) => res.status(500).json({ err }));
};
exports.default = { createBorrowBook, readAll, readBorrowBook, updateBorrowBook, deleteBorrowBook };
