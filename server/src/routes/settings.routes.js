import { Router } from 'express';
import { getPublicSettings } from '../controllers/settings.controller.js';

const router = Router();

router.get('/public', getPublicSettings);

export default router;
