
import { NextFunction, Request, Response } from "express";
import { BookDetails } from "../models/BookDetailsModel";
import mongoose from "mongoose";



const createBookDetails = (req: Request, res: Response, next: NextFunction) => {
    const { idBook, username, comment } = req.body;

    const bookDetails = new BookDetails({
        _id: new mongoose.Types.ObjectId(),
        idBook: idBook,
        username: username,
        comment: comment

    });

    return bookDetails
        .save()
        .then((bookDetails) => res.status(201).json(bookDetails))
        .catch((err) => res.status(500).json({ err }));
};


const readBookDetails = (req: Request, res: Response, next: NextFunction) => {
    const bookDetailsId = req.params.bookDetailsId;

    return BookDetails.findById(bookDetailsId)
        .then((bookDetails) =>
            bookDetails
                ? res.status(200).json({ bookDetails })
                : res.status(404).json({ message: "Not found" })
        )
        .catch((err) => res.status(500).json({ err }));
};

const readAll = (req: Request, res: Response, next: NextFunction) => {
    return BookDetails.find()
        .then((bookDetailss) => res.status(200).json(bookDetailss))
        .catch((error) => res.status(500).json({ error }));
};

const updateBookDetails = (req: Request, res: Response, next: NextFunction) => {
    const bookDetailsId = req.params.bookDetailsId;

    return BookDetails.findById(bookDetailsId)
        .then((bookDetails) => {
            if (bookDetails) {
                bookDetails.set(req.body);
                return bookDetails
                    .save()
                    .then((bookDetails) => res.status(201).json({ bookDetails }))
                    .catch((err) => res.status(500).json({ err }));
            } else {
                res.status(404).json({ message: "Not found" });
            }
        })
        .catch((err) => res.status(500).json({ err }));
};

const deleteBookDetails = (req: Request, res: Response, next: NextFunction) => {
    const bookDetailsId = req.params.bookDetailsId;

    return BookDetails.findByIdAndDelete(bookDetailsId)
        .then((bookDetails) =>
            bookDetails
                ? res.status(200).json({ message: "deleted" })
                : res.status(404).json({ message: "Not found" })
        )
        .catch((err) => res.status(500).json({ err }));
};


export default { createBookDetails, readAll, readBookDetails, updateBookDetails, deleteBookDetails };