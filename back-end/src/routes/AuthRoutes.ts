import express from 'express';
import controller from '../controllers/AuthControllers';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { changePasswordSchema, loginSchema } from '../validation/schemas';

const router = express.Router();

router.post('/login', validateBody(loginSchema), controller.login);
router.get('/me', requireAuth, controller.me);
router.post('/logout', controller.logout);
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), controller.changePassword);

export = router;
