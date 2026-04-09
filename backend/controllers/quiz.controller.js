import Quiz from '../models/Quiz.js';
import User from '../models/User.js';
import { generateGrammarQuiz } from '../services/ai.service.js';
import { updateStreak, checkBadges } from '../utils/gamification.js'; // ✅ Added

export const createQuiz = async (req, res) => {
  try {
    const { language, level } = req.body;
    const userId = req.user.id;
    const questions = await generateGrammarQuiz(language, level);
    
    const quiz = new Quiz({
      userId,
      language,
      level,
      questions
    });
    await quiz.save();
    
    // We send back questions without the answers to the frontend to prevent cheating if necessary
    // But for a simple app it's fine. We'll send it entirely so React can validate instantly without more API calls.
    res.status(201).json({ quiz });
  } catch(error) {
    res.status(500).json({ error: error.message });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { quizId, score, totalQuestions, correctAnswers } = req.body;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    
    quiz.score = score;
    quiz.completed = true;
    await quiz.save();

    // Update user performance
    const user = await User.findById(quiz.userId);
    user.quizzesTaken += 1;
    user.performanceScore += score * 10;

    // --- Accuracy tracking ---
    // totalQuestions & correctAnswers come from the frontend quiz submission
    if (typeof totalQuestions === 'number' && typeof correctAnswers === 'number') {
      user.totalQuestionsAnswered = (user.totalQuestionsAnswered || 0) + totalQuestions;
      user.totalCorrectAnswers    = (user.totalCorrectAnswers    || 0) + correctAnswers;

      // Recalculate running accuracy rate (round to 1 decimal)
      user.accuracyRate = user.totalQuestionsAnswered > 0
        ? Math.round((user.totalCorrectAnswers / user.totalQuestionsAnswered) * 1000) / 10
        : 0;
    }

    // ✅ NEW: Update Gamification (Streaks & Badges)
    updateStreak(user);
    checkBadges(user);

    await user.save();

    res.status(200).json({ quiz, user });
  } catch(error) {
    res.status(500).json({ error: error.message });
  }
};
