import { Router } from 'express';
import { submitContactMessage } from '../controllers/contact.controller.js';
import { validateBody } from '../middleware/validate.js';
import { submitContactMessageSchema } from '../validators/contact.validator.js';

const router = Router();

// Public contact inquiry submission
router.post('/', validateBody(submitContactMessageSchema), submitContactMessage);

export default router;
