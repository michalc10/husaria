"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const BorrowBookControllers_1 = __importDefault(require("../controllers/BorrowBookControllers"));
const router = express_1.default.Router();
router.get('/', BorrowBookControllers_1.default.readAll);
router.get('/:borrowBookId', BorrowBookControllers_1.default.readBorrowBook);
router.post('/', BorrowBookControllers_1.default.createBorrowBook);
router.put('/:borrowBookId', BorrowBookControllers_1.default.updateBorrowBook);
router.delete('/:borrowBookId', BorrowBookControllers_1.default.deleteBorrowBook);
module.exports = router;
