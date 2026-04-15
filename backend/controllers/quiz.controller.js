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
  } catch (error) {
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
    user.performanceScore += score * 2;

    // Dynamic Mastery: Auto-add topics and update progress instantly
    if (quiz.targetRule && typeof totalQuestions === 'number' && typeof correctAnswers === 'number') {
      const targetRuleLower = quiz.targetRule.toLowerCase();
      const targetLangLower = quiz.language.toLowerCase();
      
      let focusArea = user.focusAreas?.find(fa => 
        fa.rule.toLowerCase() === targetRuleLower && 
        fa.language.toLowerCase() === targetLangLower
      );

      if (!focusArea) {
        // Find the original casing from the curriculum to keep it clean, 
        // but default to what the quiz provided if not found.
        focusArea = {
          rule: quiz.targetRule, // Preserving original casing provided by quiz generator
          language: quiz.language,
          level: quiz.level || 0,
          masteryScore: 0,
          isFocused: true
        };
        user.focusAreas.push(focusArea);
        // Direct reference to the newly pushed subdocument
        focusArea = user.focusAreas[user.focusAreas.length - 1];
      }

      if (focusArea) {
        if (score === 100) {
          focusArea.masteryScore = 100;
          focusArea.isFocused = false; // Topic fully graduated
        } else {
          // High-speed progression boosts
          const boost = score >= 90 ? 25 : (score >= 80 ? 15 : (score >= 60 ? 5 : 0));
          focusArea.masteryScore = Math.min(99, (focusArea.masteryScore || 0) + boost);
        }
        // CRITICAL: Tell Mongoose that the nested focusAreas list has changed
        user.markModified('focusAreas');
      }
    }

    // --- Accuracy tracking ---
    // totalQuestions & correctAnswers come from the frontend quiz submission
    if (typeof totalQuestions === 'number' && typeof correctAnswers === 'number') {
      user.totalQuestionsAnswered = (user.totalQuestionsAnswered || 0) + totalQuestions;
      user.totalCorrectAnswers    = (user.totalCorrectAnswers    || 0) + correctAnswers;
      user.accuracyRate = user.totalQuestionsAnswered > 0
        ? Math.round((user.totalCorrectAnswers / user.totalQuestionsAnswered) * 1000) / 10
        : 0;
    }

    // 🏆 CRITICAL FIX: Save the user'S progress FIRST to lock in the score
    await user.save();

    // ✅ NEW: Update Gamification (Streaks & Badges)
    updateStreak(user);
    const newBadges = checkBadges(user);
    await user.save();

    // ✅ Then check for Level Unlock using the recorded progress
    const unlockStatus = await checkLevelUnlock(user._id);

    res.status(200).json({ quiz, user, unlockStatus, newBadges });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
