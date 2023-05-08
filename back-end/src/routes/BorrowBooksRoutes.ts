import express from 'express';
import controller from '../controllers/BorrowBookControllers'

const router = express.Router();


router.get('/', controller.readAll);
router.get('/:borrowBookId',controller.readBorrowBook);
router.post('/',controller.createBorrowBook);
router.put('/:borrowBookId',controller.updateBorrowBook);
router.delete('/:borrowBookId',controller.deleteBorrowBook);


export = router;