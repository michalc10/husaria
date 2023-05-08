import express from 'express';
import controller from '../controllers/BookControllers'
import { upload } from "../middleware/upload";

import extract from "../middleware/extractJWT";
const router = express.Router();



router.get('/', extract.extractJWT, controller.readAll);
router.get('/:bookId', extract.extractJWT, controller.readBook);
router.post('/', extract.extractJWT, upload.single('picture'), controller.createBook);
router.put('/:bookId', extract.extractJWT, upload.single('picture'), controller.updateBook);
router.delete('/:bookId', extract.extractJWT, controller.deleteBook);

router.get('/picture/:src/:public/:images/:file',controller.getPicture);
export = router;