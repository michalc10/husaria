"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const BookDetailsControllers_1 = __importDefault(require("../controllers/BookDetailsControllers"));
const router = express_1.default.Router();
router.get('/', BookDetailsControllers_1.default.readAll);
router.get('/:bookId', BookDetailsControllers_1.default.readBookDetails);
router.post('/', BookDetailsControllers_1.default.createBookDetails);
router.put('/:bookId', BookDetailsControllers_1.default.updateBookDetails);
router.delete('/:bookId', BookDetailsControllers_1.default.deleteBookDetails);
module.exports = router;
