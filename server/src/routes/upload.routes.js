import { Router } from 'express';
import { presignUpload } from '../controllers/upload.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.js';
import { presignUploadSchema } from '../validators/upload.validator.js';

const router = Router();

router.use(protect);
router.post('/presign', validateBody(presignUploadSchema), presignUpload);

export default router;
