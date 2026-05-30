import express from 'express';
import controller from '../controllers/TournamentControllers'
import { validateBody, validateObjectIdParam } from '../middleware/validate';
import { createTournamentSchema, updateTournamentBattlesSchema, updateTournamentSchema, updateTournamentStatusSchema } from '../validation/schemas';

const router = express.Router();



router.get('/',  controller.readAll);
router.get('/league/:leagueId', validateObjectIdParam('leagueId'), controller.readAllForLeague)
router.get('/:tournamentId/battles', validateObjectIdParam('tournamentId'), controller.readBattles);
router.put('/:tournamentId/battles', validateObjectIdParam('tournamentId'), validateBody(updateTournamentBattlesSchema), controller.updateBattles);
router.put('/:tournamentId/status', validateObjectIdParam('tournamentId'), validateBody(updateTournamentStatusSchema), controller.updateStatus);
router.get('/:tournamentId', validateObjectIdParam('tournamentId'), controller.readTournament);
router.post('/', validateBody(createTournamentSchema), controller.createTournament);
router.put('/:tournamentId', validateObjectIdParam('tournamentId'), validateBody(updateTournamentSchema), controller.updateTournament);
router.delete('/:tournamentId', validateObjectIdParam('tournamentId'), controller.deleteTournament);

export = router;
