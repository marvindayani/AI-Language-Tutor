import express from 'express';
import { getAssessments, getLatestAssessment, getAssessmentById, generateAssessment } from '../controllers/assessment.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAssessments);
router.get('/latest', protect, getLatestAssessment);
router.post('/generate', protect, generateAssessment);
router.get('/:id', protect, getAssessmentById);

export default router;
