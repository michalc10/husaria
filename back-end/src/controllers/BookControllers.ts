import { NextFunction, Request, Response, request } from "express";
import { Book } from "../models/BookModel";
import { unlink } from 'node:fs';
import mongoose from "mongoose";



const createBook = (req: Request, res: Response, next: NextFunction) => {
    const { title, author, category, ISBN, addedDate, borrowBook, rating } = req.body;
    const book = new Book({
        _id: new mongoose.Types.ObjectId(),
        title: title,
        author: author,
        category: category,
        ISBN: ISBN,
        addedDate: addedDate,
        borrowBook: borrowBook,
        rating: rating

    });
    return book
        .save()
        .then((book) => res.status(201).json(book))
        .catch((err) => res.status(500).json({ err }));
};


const readBook = (req: Request, res: Response, next: NextFunction) => {
    const bookId = req.params.bookId;

    return Book.findById(bookId)
        .then((book) =>
            book
                ? res.status(200).json(book)
                : res.status(404).json({ message: "Not found" })
        )
        .catch((err) => res.status(500).json({ err }));
};

const readAll = (req: Request, res: Response, next: NextFunction) => {
    return Book.find()
        .then((books) => res.status(200).json(books))
        .catch((error) => res.status(500).json({ error }));
};

const updateBook = (req: Request, res: Response, next: NextFunction) => {
    const bookId = req.params.bookId;
    return Book.findById(bookId)
        .then((book) => {
            if (book) {
                book.set(req.body);
                return book
                    .save()
                    .then((book) => res.status(201).json(book))
                    .catch((err) => res.status(500).json({ err }));
            } else {
                res.status(404).json({ message: "Not found" });
            }
        })
        .catch((err) => res.status(500).json({ err }));
};

const deleteBook = (req: Request, res: Response, next: NextFunction) => {
    const bookId = req.params.bookId;

    return Book.findByIdAndDelete(bookId)
        .then((book) =>{
            book
                ? res.status(200).json({ message: "deleted" })
                : res.status(404).json({ message: "Not found" })
        }
        
            
        )
        .catch((err) => res.status(500).json({ err }));
};


export default { createBook, readAll, readBook, updateBook, deleteBook };