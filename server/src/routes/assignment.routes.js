import { Router } from 'express';
import {
  submitSolutionStudent,
  getMySubmissionStudent,
} from '../controllers/assignment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { requireApprovedEnrollment } from '../middleware/enrollment.middleware.js';
import { validateBody } from '../middleware/validate.js';
import { submitSolutionSchema } from '../validators/assignment.validator.js';

const router = Router();

// Student Protected Assignment Submission & Feedback Routes
// All routes require user authentication and verified approved enrollment
router.post(
  '/assignments/:id/submit',
  protect,
  requireApprovedEnrollment,
  validateBody(submitSolutionSchema),
  submitSolutionStudent
);

router.get(
  '/assignments/:id/my-submission',
  protect,
  requireApprovedEnrollment,
  getMySubmissionStudent
);

export default router;
