import express from 'express';
import controller from '../controllers/UserControllers';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody, validateObjectIdParam } from '../middleware/validate';
import { createUserSchema, resetUserPasswordSchema, updateUserSchema } from '../validation/schemas';

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', controller.readAll);
router.get('/:userId', validateObjectIdParam('userId'), controller.readUser);
router.post('/', validateBody(createUserSchema), controller.createUser);
router.put('/:userId', validateObjectIdParam('userId'), validateBody(updateUserSchema), controller.updateUser);
router.post('/:userId/reset-password', validateObjectIdParam('userId'), validateBody(resetUserPasswordSchema), controller.resetPassword);
router.post('/:userId/deactivate', validateObjectIdParam('userId'), controller.deactivate);
router.post('/:userId/activate', validateObjectIdParam('userId'), controller.activate);

export = router;
