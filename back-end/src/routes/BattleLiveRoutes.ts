import express from 'express';
import controller from '../controllers/JudgeStationControllers';
import { validateBody, validateObjectIdParam } from '../middleware/validate';
import { updateBattleLiveStateSchema } from '../validation/schemas';

const router = express.Router();

router.get('/:battleId/live-state', validateObjectIdParam('battleId'), controller.readLiveState);
router.put(
  '/:battleId/live-state',
  validateObjectIdParam('battleId'),
  validateBody(updateBattleLiveStateSchema),
  controller.updateLiveState
);

export = router;
