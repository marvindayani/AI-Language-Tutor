import Assessment from '../models/Assessment.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Quiz from '../models/Quiz.js';
import { generateCEFRAssessment } from '../services/ai.service.js';

export const getAssessments = async (req, res) => {
  try {
    const userId = req.user.id;
    const assessments = await Assessment.find({ userId })
      .sort({ createdAt: -1 });
    res.status(200).json({ assessments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLatestAssessment = async (req, res) => {
  try {
    const userId = req.user.id;
    const assessment = await Assessment.findOne({ userId })
      .sort({ createdAt: -1 });
    res.status(200).json({ assessment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findById(id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    res.status(200).json({ assessment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const generateAssessment = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const milestone = Math.floor(user.sessionsCompleted / 5) * 5;
    if (milestone === 0) return res.status(400).json({ error: 'Complete at least 5 sessions first' });

    // Check if assessment already exists for this milestone
    const existing = await Assessment.findOne({ userId, milestone });
    if (existing) return res.status(200).json({ assessment: existing, message: 'Assessment already exists' });

    // Fetch data for the last 5 sessions that actually have summaries
    const sessionsWithSummaries = await Session.find({ userId, summary: { $ne: null } })
      .sort({ createdAt: -1 })
      .limit(5);

    // Fetch last 10 quizzes
    const recentQuizzes = await Quiz.find({ userId, completed: true })
      .sort({ createdAt: -1 })
      .limit(10);

    const assessmentData = await generateCEFRAssessment(
      user.language,
      user.level,
      sessionsWithSummaries.map(s => s.summary),
      recentQuizzes.map(q => ({ score: q.score, language: q.language, date: q.createdAt }))
    );

    const newAssessment = new Assessment({
      userId: user._id,
      language: user.language,
      cefrLevel: assessmentData.cefrLevel,
      milestone: milestone,
      report: assessmentData.report,
      strengths: assessmentData.strengths,
      weaknesses: assessmentData.weaknesses,
      nextSteps: assessmentData.nextSteps,
      sessionIds: sessionsWithSummaries.map(s => s._id)
    });

    console.log(newAssessment);

    await newAssessment.save();
    res.status(201).json({ assessment: newAssessment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
