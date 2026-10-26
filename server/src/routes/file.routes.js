import { Router } from 'express';
import { getFileDownloadUrl } from '../controllers/upload.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateQuery } from '../middleware/validate.js';
import { fileUrlQuerySchema } from '../validators/upload.validator.js';

const router = Router();

router.use(protect);
router.get('/url', validateQuery(fileUrlQuerySchema), getFileDownloadUrl);

export default router;
