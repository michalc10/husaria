import express from 'express';
import controller from '../controllers/BannerControllers';
import { validateBody, validateObjectIdParam } from '../middleware/validate';
import { createBannerSchema, updateBannerSchema } from '../validation/schemas';

const router = express.Router();

router.get('/', controller.readAll);
router.get('/:bannerId', validateObjectIdParam('bannerId'), controller.readBanner);
router.post('/', validateBody(createBannerSchema), controller.createBanner);
router.put('/:bannerId', validateObjectIdParam('bannerId'), validateBody(updateBannerSchema), controller.updateBanner);
router.delete('/:bannerId', validateObjectIdParam('bannerId'), controller.deleteBanner);

export = router;
