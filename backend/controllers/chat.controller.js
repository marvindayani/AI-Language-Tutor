import Session from '../models/Session.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import Assessment from '../models/Assessment.js';
import { generateTutorResponse, generateSessionSummary, generateCEFRAssessment } from '../services/ai.service.js';
import { updateStreak, checkBadges } from '../utils/gamification.js';
import { checkLevelUnlock } from './learning.controller.js';

export const startSession = async (req, res) => {
  try {
    const { language, level, scenario, focusRule } = req.body;
    const userId = req.user.id;

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.language = language;
    user.level = level;
    await user.save();

    const session = new Session({
      userId: user._id,
      language,
      level,
      scenario: scenario || null,
      focusRule: focusRule || null,
      isActive: true
    });
    await session.save();

    res.status(201).json({ session, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { sessionId, text } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Save user message
    const userMessage = new Message({
      sessionId,
      role: 'user',
      text
    });
    await userMessage.save();

    // Fetch conversation history for context
    const recentMessages = await Message.find({ sessionId }).sort({ createdAt: 1 }).limit(20);
    const chatHistory = recentMessages.slice(0, -1).map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    // Generate AI response
    const aiData = await generateTutorResponse(session.language, session.level, chatHistory, text, session.scenario, session.focusRule);

    // Save AI response
    const aiMessage = new Message({
      sessionId,
      role: 'ai',
      text: aiData.reply,
      fullCorrection: aiData.fullCorrection || null,
      corrections: aiData.corrections || []
    });
    await aiMessage.save();

    // ✅ Update the original user message with the same corrections + fullCorrection!
    userMessage.corrections = aiData.corrections || [];
    userMessage.fullCorrection = aiData.fullCorrection || null;
    await userMessage.save();

    res.status(200).json({
      userMessage,
      aiMessage,
      newVocabulary: aiData.newVocabulary || []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const endSession = async (req, res) => {
  try {
    const { sessionId: id } = req.params;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = await Message.find({ sessionId: id }).sort({ createdAt: 1 });

    const chatHistory = messages.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      text: msg.text,
      corrections: msg.corrections || []
    }));

    const summaryData = await generateSessionSummary(
      session.language,
      session.level,
      chatHistory
    );

    session.isActive = false;
    session.summary = summaryData;

    await session.save();

    // Update user stats + accuracy tracking
    const user = await User.findById(session.userId);
    if (user) {
      user.sessionsCompleted += 1;
      user.performanceScore += 10; // Reward for practice

      // --- Accuracy tracking for Chat / Voice sessions ---
      const userMessages = messages.filter(m => m.role === 'user');
      const totalAttempts = userMessages.length;
      const correctAttempts = userMessages.filter(
        m => !m.corrections || m.corrections.length === 0
      ).length;

      if (totalAttempts > 0) {
        user.totalQuestionsAnswered = (user.totalQuestionsAnswered || 0) + totalAttempts;
        user.totalCorrectAnswers = (user.totalCorrectAnswers || 0) + correctAttempts;

        user.accuracyRate = user.totalQuestionsAnswered > 0
          ? Math.round((user.totalCorrectAnswers / user.totalQuestionsAnswered) * 1000) / 10
          : 0;
      }

      // --- Mastery Tracking for Focus Rule Sessions ---
      if (session.focusRule) {
        const focusArea = user.focusAreas?.find(fa => fa.rule === session.focusRule);
        if (focusArea && totalAttempts > 0) {
          const accuracy = (correctAttempts / totalAttempts) * 100;
          const masteryDelta = accuracy >= 80 ? 15 : (accuracy >= 60 ? 5 : -5);
          focusArea.masteryScore = Math.min(100, Math.max(0, (focusArea.masteryScore || 0) + masteryDelta));
        }
      }

      // ✅ Check for Level Unlock!
      await checkLevelUnlock(user._id);

      // ✅ NEW: Update Gamification (Streaks & Badges)
      updateStreak(user);
      checkBadges(user);

      await user.save();

      // ✅ Trigger CEFR Level Assessment every 5 sessions
      if (user.sessionsCompleted > 0 && user.sessionsCompleted % 5 === 0) {
        try {
          const lastSessions = await Session.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(5);

          const recentQuizzes = await Quiz.find({ userId: user._id, completed: true })
            .sort({ createdAt: -1 })
            .limit(10);

          const assessmentData = await generateCEFRAssessment(
            session.language,
            session.level,
            lastSessions.map(s => s.summary),
            recentQuizzes.map(q => ({ score: q.score, language: q.language, date: q.createdAt }))
          );

          const newAssessment = new Assessment({
            userId: user._id,
            language: session.language,
            cefrLevel: assessmentData.cefrLevel,
            milestone: user.sessionsCompleted,
            report: assessmentData.report,
            strengths: assessmentData.strengths,
            weaknesses: assessmentData.weaknesses,
            nextSteps: assessmentData.nextSteps,
            sessionIds: lastSessions.map(s => s._id)
          });

          await newAssessment.save();
          console.log(`✅ CEFR Assessment Generated for user ${user._id}: ${assessmentData.cefrLevel}`);
        } catch (assessError) {
          console.error("❌ CEFR Assessment Trigger Error:", assessError);
        }
      }
    }

    res.status(200).json({ session });

  } catch (error) {
    console.error("❌ END SESSION ERROR:", error);
    res.status(500).json({ error: error.message || "Failed to end session" });
  }
};

export const getSessionHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await Message.find({ sessionId }).sort({ createdAt: 1 });
    const session = await Session.findById(sessionId);
    res.status(200).json({ session, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionsWithMessages = await Message.distinct('sessionId');
    const sessions = await Session.find({
      userId,
      _id: { $in: sessionsWithMessages }
    }).sort({ createdAt: -1 });

    res.status(200).json({ sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    await Message.deleteMany({ sessionId });
    const session = await Session.findByIdAndDelete(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.status(200).json({ message: "Session and its messages deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
