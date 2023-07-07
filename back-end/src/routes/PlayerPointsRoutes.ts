import express from 'express';
import controller from '../controllers/PlayerPointsControllers'

const router = express.Router();



router.get('/tournament/:tournamentId',  controller.readAll);
router.get('/:playerPointsId', controller.readPlayerPoints);
router.post('/', controller.createPlayerPoints);
router.put('/:playerPointsId', controller.updatePlayerPoints);
router.delete('/:playerPointsId', controller.deletePlayerPoints);


export = router;