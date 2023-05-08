import express from 'express';
import controller from '../controllers/AdminPermissionControllers'

const router = express.Router();


router.get('/', controller.readAll);
router.get('/:adminPermissionId',controller.readAdminPermission);
router.post('/',controller.createAdminPermission);
router.put('/:adminPermissionId',controller.updateAdminPermission);
router.delete('/:adminPermissionId',controller.deleteAdminPermission);



export = router;