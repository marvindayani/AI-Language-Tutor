import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  getFocusAreas, 
  addFocusArea, 
  updateFocusAreaStatus, 
  generateLesson,
  generateStarterPack,
  getAdaptiveLesson
} from '../controllers/learning.controller.js';

const router = express.Router();

router.get('/focus-areas', protect, getFocusAreas);
router.post('/focus-areas', protect, addFocusArea);
router.put('/focus-areas/status', protect, updateFocusAreaStatus);
router.post('/lesson', protect, generateLesson);
router.post('/remedial-lesson', protect, getAdaptiveLesson);
router.post('/starter-pack', protect, generateStarterPack);

export default router;
