import express from 'express';
import controller from '../controllers/TournamentControllers'

const router = express.Router();



router.get('/',  controller.readAll);
router.get('/:tournamentId', controller.readTournament);
router.post('/', controller.createTournament);
router.put('/:tournamentId', controller.updateTournament);
router.delete('/:tournamentId', controller.deleteTournament);
router.get('/league/:leagueId',controller.readAllForLeague)

export = router;