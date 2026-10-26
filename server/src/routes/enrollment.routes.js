import { Router } from 'express';
import {
  createEnrollment,
  getMyEnrollments,
  getEnrollmentById,
  cancelMyEnrollment,
} from '../controllers/enrollment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.js';
import { createEnrollmentSchema } from '../validators/enrollment.validator.js';

const router = Router();

// All student enrollment routes require authentication
router.use(protect);

router.post('/', validateBody(createEnrollmentSchema), createEnrollment);
router.get('/mine', getMyEnrollments);
router.get('/:id', getEnrollmentById);
router.patch('/:id/cancel', cancelMyEnrollment);

export default router;
