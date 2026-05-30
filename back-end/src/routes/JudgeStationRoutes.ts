import express from 'express';
import controller from '../controllers/JudgeStationControllers';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateObjectIdParam } from '../middleware/validate';
import { updateJudgeSessionResultSchema } from '../validation/schemas';

const router = express.Router();

router.get('/session', controller.readSession);
router.put('/session/result', validateBody(updateJudgeSessionResultSchema), controller.updateSessionResult);
router.get('/battle/:battleId', requireAuth, validateObjectIdParam('battleId'), controller.listForBattle);
router.post(
  '/battle/:battleId/category/:categoryId',
  requireAuth,
  validateObjectIdParam('battleId'),
  validateObjectIdParam('categoryId'),
  controller.createOrRegenerate
);
router.delete('/:stationId', requireAuth, validateObjectIdParam('stationId'), controller.revoke);

export = router;
