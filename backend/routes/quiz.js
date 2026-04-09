import express from 'express';
import { createQuiz, submitQuiz } from '../controllers/quiz.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate', protect, createQuiz);
router.post('/submit', protect, submitQuiz);

export default router;
