import { NextFunction, Request, Response } from "express";
import  BorrowBook from "../models/BorrowBookModel";
import mongoose from "mongoose";



const createBorrowBook = (req: Request, res: Response, next: NextFunction) => {
    const { bookId, bookTitle, userId, dateOut, dateIn, status } = req.body;

    const borrowBook = new BorrowBook({
        _id: new mongoose.Types.ObjectId(),
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


const readBorrowBook = (req: Request, res: Response, next: NextFunction) => {
    const borrowBookId = req.params.borrowBookId;

    return BorrowBook.findById(borrowBookId)
        .then((borrowBook) =>
            borrowBook
                ? res.status(200).json({ borrowBook })
                : res.status(404).json({ message: "Not found" })
        )
        .catch((err) => res.status(500).json({ err }));
};

const readAll = (req: Request, res: Response, next: NextFunction) => {
    return BorrowBook.find()
        .then((borrowBooks) => res.status(200).json(borrowBooks))
        .catch((error) => res.status(500).json({ error }));
};

const updateBorrowBook = (req: Request, res: Response, next: NextFunction) => {
    const borrowBookId = req.params.borrowBookId;

    return BorrowBook.findById(borrowBookId)
        .then((borrowBook) => {
            if (borrowBook) {
                borrowBook.set(req.body);
                return borrowBook
                    .save()
                    .then((borrowBook) => res.status(201).json( borrowBook ))
                    .catch((err) => res.status(500).json({ err }));
            } else {
                res.status(404).json({ message: "Not found" });
            }
        })
        .catch((err) => res.status(500).json({ err }));
};

const deleteBorrowBook = (req: Request, res: Response, next: NextFunction) => {
    const borrowBookId = req.params._id;

    return BorrowBook.findByIdAndDelete(borrowBookId)
        .then((borrowBook) =>
            borrowBook
                ? res.status(200).json({ message: "deleted" })
                : res.status(404).json({ message: "Not found" })
        )
        .catch((err) => res.status(500).json({ err }));
};


export default { createBorrowBook, readAll, readBorrowBook, updateBorrowBook, deleteBorrowBook };