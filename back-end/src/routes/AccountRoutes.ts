import express from 'express';
import controller from '../controllers/AccountControllers'
import extract from '../middleware/extractJWT';

const router = express.Router();

router.get('/validate', extract.extractJWT, controller.validateToken);
router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/', controller.getAllAccounts);
router.post('/refreshToken',extract.extractJWTRefresh, controller.getRefreshToken);

// router.post('/create',controller.createAccount);
// router.get('/get/:accountId',controller.readAccount);
// router.get('/get', controller.readAll);
// router.patch('/update/:accountId',controller.updateAccount);
// router.delete('/delete/:accountId',controller.deleteAccount);


export = router;