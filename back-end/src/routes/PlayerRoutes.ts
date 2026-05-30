import express from 'express';
import controller from '../controllers/PlayerControllers'
import { validateBody, validateObjectIdParam } from '../middleware/validate';
import { createPlayerSchema, updatePlayerSchema } from '../validation/schemas';

const router = express.Router();



router.get('/',  controller.readAll);
router.get('/:playerId', validateObjectIdParam('playerId'), controller.readPlayer);
router.post('/', validateBody(createPlayerSchema), controller.createPlayer);
router.put('/:playerId', validateObjectIdParam('playerId'), validateBody(updatePlayerSchema), controller.updatePlayer);
router.delete('/:playerId', validateObjectIdParam('playerId'), controller.deletePlayer);

export = router;
