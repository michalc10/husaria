import express from 'express';
import controller from '../controllers/JudgeStationControllers';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateObjectIdParam } from '../middleware/validate';
import { createJudgeStationSchema, updateJudgeSessionResultSchema, updateJudgeStationSchema } from '../validation/schemas';

const router = express.Router();

router.get('/session', controller.readSession);
router.put('/session/result', validateBody(updateJudgeSessionResultSchema), controller.updateSessionResult);

router.get('/tournament/:tournamentId', requireAuth, validateObjectIdParam('tournamentId'), controller.listForTournament);
router.post(
  '/tournament/:tournamentId',
  requireAuth,
  validateObjectIdParam('tournamentId'),
  validateBody(createJudgeStationSchema),
  controller.create
);
router.put('/:stationId', requireAuth, validateObjectIdParam('stationId'), validateBody(updateJudgeStationSchema), controller.update);
router.post('/:stationId/regenerate-token', requireAuth, validateObjectIdParam('stationId'), controller.regenerateToken);
router.delete('/:stationId', requireAuth, validateObjectIdParam('stationId'), controller.revoke);

export = router;
