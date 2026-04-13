import Quiz from '../models/Quiz.js';
import User from '../models/User.js';
import { generateGrammarQuiz } from '../services/ai.service.js';
import { updateStreak, checkBadges } from '../utils/gamification.js';
import { checkLevelUnlock } from './learning.controller.js';

export const createQuiz = async (req, res) => {
  try {
    const { language, level, focusRule, previousMistakes } = req.body;
    const userId = req.user.id;
    const questions = await generateGrammarQuiz(language, level, focusRule, previousMistakes);
    
    const quiz = new Quiz({
      userId,
      language,
      level,
      questions,
      targetRule: focusRule || null,
      mistakes: []
    });
    await quiz.save();
    
    res.status(201).json({ quiz });
  } catch(error) {
    res.status(500).json({ error: error.message });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { quizId, score, totalQuestions, correctAnswers, mistakesData } = req.body;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    
    quiz.score = score;
    quiz.completed = true;
    if (mistakesData) quiz.mistakes = mistakesData;
    await quiz.save();

    // Update user performance
    const user = await User.findById(quiz.userId);
    user.quizzesTaken += 1;
    user.performanceScore += score * 10;

    // Strict Mastery Logic: Topic is 100% complete ONLY if quiz score is 100%
    if (quiz.targetRule && typeof totalQuestions === 'number' && typeof correctAnswers === 'number') {
      const focusArea = user.focusAreas?.find(fa => fa.rule === quiz.targetRule && fa.language === quiz.language);
      if (focusArea) {
        if (score === 100) {
          focusArea.masteryScore = 100;
          focusArea.isFocused = false; // "Graduated"
        } else {
          // If not 100, we don't advance to 100%. 
          // We can still give a small boost for high scores, but not "Completion"
          const boost = score >= 80 ? 5 : (score >= 60 ? 2 : 0);
          focusArea.masteryScore = Math.min(99, (focusArea.masteryScore || 0) + boost);
        }
      }
    }

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

    // ✅ Check for Level Unlock!
    const unlockStatus = await checkLevelUnlock(user._id);

    await user.save();

    res.status(200).json({ quiz, user, unlockStatus });
  } catch(error) {
    res.status(500).json({ error: error.message });
  }
};
