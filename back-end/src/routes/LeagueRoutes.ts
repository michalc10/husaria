import express from 'express';
import controller from '../controllers/LeagueControllers'
import { requireRole } from '../middleware/auth';
import { validateBody, validateObjectIdParam } from '../middleware/validate';
import { createFinalTournamentSchema, createLeagueSchema, updateLeagueSchema } from '../validation/schemas';

const router = express.Router();



router.get('/',  controller.readAll);
router.get('/:leagueId/standings', validateObjectIdParam('leagueId'), controller.readStandings);
router.get('/:leagueId/team-standings', validateObjectIdParam('leagueId'), controller.readTeamStandings);
router.post('/:leagueId/final-tournament', validateObjectIdParam('leagueId'), validateBody(createFinalTournamentSchema), controller.createFinalTournament);
router.get('/:leagueId', validateObjectIdParam('leagueId'), controller.readLeague);
router.post('/', validateBody(createLeagueSchema), controller.createLeague);
router.put('/:leagueId', validateObjectIdParam('leagueId'), validateBody(updateLeagueSchema), controller.updateLeague);
router.delete('/:leagueId', requireRole('ADMIN'), validateObjectIdParam('leagueId'), controller.deleteLeague);

export = router;
