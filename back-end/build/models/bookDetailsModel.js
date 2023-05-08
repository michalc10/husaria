"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookDetails = void 0;
const mongoose_1 = require("mongoose");
const bookDetailsSchema = new mongoose_1.Schema({
    idBook: { type: String, required: true, default: '-1' },
    username: { type: String, required: true, default: "Please entere a username" },
    comment: { type: String, required: true }
});
exports.BookDetails = (0, mongoose_1.model)('BookDetails', bookDetailsSchema);
