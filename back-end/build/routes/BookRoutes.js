"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const BookControllers_1 = __importDefault(require("../controllers/BookControllers"));
const upload_1 = require("../middleware/upload");
const extractJWT_1 = __importDefault(require("../middleware/extractJWT"));
const router = express_1.default.Router();
router.get('/', extractJWT_1.default.extractJWT, BookControllers_1.default.readAll);
router.get('/:bookId', extractJWT_1.default.extractJWT, BookControllers_1.default.readBook);
router.post('/', extractJWT_1.default.extractJWT, upload_1.upload.single('picture'), BookControllers_1.default.createBook);
router.put('/:bookId', extractJWT_1.default.extractJWT, upload_1.upload.single('picture'), BookControllers_1.default.updateBook);
router.delete('/:bookId', extractJWT_1.default.extractJWT, BookControllers_1.default.deleteBook);
router.get('/picture/:src/:public/:images/:file', BookControllers_1.default.getPicture);
module.exports = router;
