import { Router } from 'express';
import {
  getPublicCourses,
  getPublicCourseBySlug,
} from '../controllers/course.controller.js';

const router = Router();

router.get('/', getPublicCourses);
router.get('/:slug', getPublicCourseBySlug);

export default router;
