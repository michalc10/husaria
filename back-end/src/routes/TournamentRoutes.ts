import express from 'express';
import controller from '../controllers/TournamentControllers'
import judgeStationController from '../controllers/JudgeStationControllers';
import { requireRole } from '../middleware/auth';
import { validateBody, validateObjectIdParam } from '../middleware/validate';
import {
  createTournamentSchema,
  updateTournamentBattlesSchema,
  updateTournamentLiveStateSchema,
  updateTournamentSchema,
  updateTournamentStatusSchema
} from '../validation/schemas';

const router = express.Router();



router.get('/',  controller.readAll);
router.get('/league/:leagueId', validateObjectIdParam('leagueId'), controller.readAllForLeague)
router.get('/:tournamentId/battles', validateObjectIdParam('tournamentId'), controller.readBattles);
router.put('/:tournamentId/battles', validateObjectIdParam('tournamentId'), validateBody(updateTournamentBattlesSchema), controller.updateBattles);
router.put('/:tournamentId/status', validateObjectIdParam('tournamentId'), validateBody(updateTournamentStatusSchema), controller.updateStatus);
router.get('/:tournamentId/live-state', validateObjectIdParam('tournamentId'), judgeStationController.readTournamentLiveState);
router.put(
  '/:tournamentId/live-state',
  validateObjectIdParam('tournamentId'),
  validateBody(updateTournamentLiveStateSchema),
  judgeStationController.updateTournamentLiveState
);
router.get('/:tournamentId', validateObjectIdParam('tournamentId'), controller.readTournament);
router.post('/', validateBody(createTournamentSchema), controller.createTournament);
router.put('/:tournamentId', validateObjectIdParam('tournamentId'), validateBody(updateTournamentSchema), controller.updateTournament);
router.delete('/:tournamentId', requireRole('ADMIN'), validateObjectIdParam('tournamentId'), controller.deleteTournament);

export = router;
