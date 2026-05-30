import express from 'express';
import controller from '../controllers/CompetitionTemplateControllers';
import { validateBody, validateObjectIdParam } from '../middleware/validate';
import { createCompetitionTemplateSchema, updateCompetitionTemplateSchema } from '../validation/schemas';

const router = express.Router();

router.get('/', controller.readAll);
router.get('/:templateId', validateObjectIdParam('templateId'), controller.readTemplate);
router.post('/', validateBody(createCompetitionTemplateSchema), controller.createTemplate);
router.put('/:templateId', validateObjectIdParam('templateId'), validateBody(updateCompetitionTemplateSchema), controller.updateTemplate);
router.delete('/:templateId', validateObjectIdParam('templateId'), controller.deleteTemplate);

export = router;
