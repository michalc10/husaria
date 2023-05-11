import express from 'express';
import controller from '../controllers/BookControllers'

const router = express.Router();



router.get('/',  controller.readAll);
router.get('/:bookId', controller.readBook);
router.post('/', controller.createBook);
router.put('/:bookId', controller.updateBook);
router.delete('/:bookId', controller.deleteBook);

export = router;