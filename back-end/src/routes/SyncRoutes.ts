import express from 'express';
import controller from '../controllers/SyncControllers';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { syncMutationsSchema } from '../validation/schemas';

const router = express.Router();

router.get('/bootstrap', requireAuth, controller.bootstrap);
router.post('/mutations', validateBody(syncMutationsSchema), controller.mutations);

export = router;
