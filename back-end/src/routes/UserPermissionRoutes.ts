import express from 'express';
import controller from '../controllers/UserPermissionControllers'

const router = express.Router();


router.get('/', controller.readAll);
router.get('/:userPermissionId',controller.readUserPermission);
router.post('/',controller.createUserPermission);
router.put('/:userPermissionId',controller.updateUserPermission);
router.delete('/:userPermissionId',controller.deleteUserPermission);


export = router;