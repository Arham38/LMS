import { Router } from 'express';
import { joinSessionStudent } from '../controllers/session.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { requireApprovedEnrollment } from '../middleware/enrollment.middleware.js';

const router = Router();

// Student Join Route (Requires Approved Enrollment & Join Window Verification)
router.post('/:id/join', protect, requireApprovedEnrollment, joinSessionStudent);

export default router;
