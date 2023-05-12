import express from 'express';
import controller from '../controllers/LeagueControllers'

const router = express.Router();



router.get('/',  controller.readAll);
router.get('/:leagueId', controller.readLeague);
router.post('/', controller.createLeague);
router.put('/:leagueId', controller.updateLeague);
router.delete('/:leagueId', controller.deleteLeague);

export = router;