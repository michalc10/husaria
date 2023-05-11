import express from 'express';
import controller from '../controllers/PlayerControllers'

const router = express.Router();



router.get('/',  controller.readAll);
router.get('/:playerId', controller.readPlayer);
router.post('/', controller.createPlayer);
router.put('/:playerId', controller.updatePlayer);
router.delete('/:playerId', controller.deletePlayer);

export = router;