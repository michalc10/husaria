import express from 'express';
import controller from '../controllers/LeagueControllers'
import { validateBody, validateObjectIdParam } from '../middleware/validate';
import { createLeagueSchema, updateLeagueSchema } from '../validation/schemas';

const router = express.Router();



router.get('/',  controller.readAll);
router.get('/:leagueId', validateObjectIdParam('leagueId'), controller.readLeague);
router.post('/', validateBody(createLeagueSchema), controller.createLeague);
router.put('/:leagueId', validateObjectIdParam('leagueId'), validateBody(updateLeagueSchema), controller.updateLeague);
router.delete('/:leagueId', validateObjectIdParam('leagueId'), controller.deleteLeague);

export = router;
