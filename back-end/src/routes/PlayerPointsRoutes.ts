import express from 'express';
import controller from '../controllers/PlayerPointsControllers'
import { validateBody, validateObjectIdParam } from '../middleware/validate';
import { createPlayerPointsSchema, updateBattleResultSchema, updatePlayerPointsSchema } from '../validation/schemas';

const router = express.Router();



router.get('/tournament/:tournamentId', validateObjectIdParam('tournamentId'), controller.readAll);
router.put(
  '/:playerPointsId/battle-results/:battleId',
  validateObjectIdParam('playerPointsId'),
  validateObjectIdParam('battleId'),
  validateBody(updateBattleResultSchema),
  controller.updateBattleResult
);
router.get('/:playerPointsId', validateObjectIdParam('playerPointsId'), controller.readPlayerPoints);
router.post('/', validateBody(createPlayerPointsSchema), controller.createPlayerPoints);
router.put('/:playerPointsId', validateObjectIdParam('playerPointsId'), validateBody(updatePlayerPointsSchema), controller.updatePlayerPoints);
router.delete('/:playerPointsId', validateObjectIdParam('playerPointsId'), controller.deletePlayerPoints);


export = router;
