import { startSession, sendMessage, endSession, getSessionHistory, getUserSessions, deleteSession } from '../controllers/chat.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import express from 'express';

const router = express.Router();

router.post('/session', protect, startSession);
router.post('/message', protect, sendMessage);
router.post('/session/:sessionId/end', protect, endSession);
router.get('/session/:sessionId', protect, getSessionHistory);
router.get('/sessions', protect, getUserSessions);
router.delete('/session/:sessionId', protect, deleteSession);

export default router;
