import { getUserStats, getLeaderboard } from '../controllers/user.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import express from 'express';

const router = express.Router();

router.get('/stats', protect, getUserStats);
router.get('/leaderboard', protect, getLeaderboard);

export default router;
