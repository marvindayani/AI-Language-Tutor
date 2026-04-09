import User from '../models/User.js';
import Session from '../models/Session.js';
import Quiz from '../models/Quiz.js';

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fetch all completed sessions for vocabulary aggregation and trends
    const sessions = await Session.find({ userId, isActive: false }).sort({ createdAt: 1 });
    
    // Aggregate unique vocabulary words learned
    const vocabularyWords = new Set();
    sessions.forEach(sess => {
      if (sess.summary?.vocabulary) {
        sess.summary.vocabulary.forEach(word => vocabularyWords.add(word));
      }
    });

    // Aggregate common mistakes
    const commonMistakes = [];
    sessions.forEach(sess => {
      if (sess.summary?.mistakes) {
        sess.summary.mistakes.forEach(mistake => commonMistakes.push(mistake));
      }
    });

    // Performance trends: Aggregate volume of practice over days
    const performanceMap = {};
    sessions.forEach(sess => {
      const dateStr = new Date(sess.createdAt).toLocaleDateString();
      performanceMap[dateStr] = (performanceMap[dateStr] || 0) + 1;
    });

    const performanceTrend = Object.keys(performanceMap).map(date => ({
      date,
      sessions: performanceMap[date]
    }));

    // Fetch all quiz results for trends
    const quizzes = await Quiz.find({ userId, completed: true }).sort({ createdAt: 1 });
    const quizStats = quizzes.map(q => ({
      date: new Date(q.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      score: q.score,
      language: q.language
    }));

    // Build accuracy trend: running accuracy % after each quiz
    let runningTotal = 0, runningCorrect = 0;
    const accuracyTrend = quizzes.map(q => {
      const total   = q.questions?.length || 0;
      const correct = Math.round((q.score / 100) * total); // score is a % from the frontend
      runningTotal   += total;
      runningCorrect += correct;
      return {
        date    : new Date(q.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        accuracy: runningTotal > 0
          ? Math.round((runningCorrect / runningTotal) * 1000) / 10
          : 0
      };
    });

res.status(200).json({
      user,
      totalVocabulary: vocabularyWords.size,
      allVocabulary: Array.from(vocabularyWords),
      commonMistakes: commonMistakes.slice(-10), // last 10 mistakes for simple review
      performanceTrend,
      quizStats,
      accuracyTrend
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const { language } = req.query;
    
    // Build query based on optional language filter
    const query = language && language !== 'Global' ? { language } : {};
    
    const leaderboard = await User.find(query)
      .select('name performanceScore accuracyRate language streakCount')
      .sort({ performanceScore: -1 })
      .limit(20);
      
    res.status(200).json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
