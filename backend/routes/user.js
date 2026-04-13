import { getUserStats, getLeaderboard, updateSettings } from '../controllers/user.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import express from 'express';

const router = express.Router();

router.get('/stats', protect, getUserStats);
router.get('/leaderboard', protect, getLeaderboard);
router.put('/settings', protect, updateSettings);

export default router;
