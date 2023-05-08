import express from 'express';
import controller from '../controllers/BookDetailsControllers'

const router = express.Router();


router.get('/', controller.readAll);
router.get('/:bookId',controller.readBookDetails);
router.post('/',controller.createBookDetails);
router.put('/:bookId',controller.updateBookDetails);
router.delete('/:bookId',controller.deleteBookDetails);


export = router;