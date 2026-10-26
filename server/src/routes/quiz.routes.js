import { Router } from 'express';
import {
  startQuizAttemptStudent,
  saveAttemptAnswersStudent,
  submitQuizAttemptStudent,
  getAttemptDetails,
} from '../controllers/quiz.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { requireApprovedEnrollment } from '../middleware/enrollment.middleware.js';
import { validateBody } from '../middleware/validate.js';
import { saveAnswersSchema } from '../validators/quiz.validator.js';

const router = Router();

// Student Quiz Start (Requires Approved Enrollment)
router.post('/quizzes/:id/start', protect, requireApprovedEnrollment, startQuizAttemptStudent);

// Student Attempt Progress, Submit & Details
router.patch('/attempts/:id/answers', protect, validateBody(saveAnswersSchema), saveAttemptAnswersStudent);
router.post('/attempts/:id/submit', protect, submitQuizAttemptStudent);
router.get('/attempts/:id', protect, getAttemptDetails);

export default router;
