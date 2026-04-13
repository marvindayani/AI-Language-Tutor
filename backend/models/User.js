import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  language: { type: String, default: 'English' },
  level: { type: String, default: 'beginner', enum: ['beginner', 'intermediate', 'advanced'] },
  performanceScore: { type: Number, default: 0 },
  quizzesTaken: { type: Number, default: 0 },
  sessionsCompleted: { type: Number, default: 0 },
  totalQuestionsAnswered: { type: Number, default: 0 },
  totalCorrectAnswers: { type: Number, default: 0 },
  accuracyRate: { type: Number, default: 0 }, // percentage 0-100
  streakCount: { type: Number, default: 0 },
  lastActivityDate: { type: Date, default: null },
  highestStreak: { type: Number, default: 0 },
  currentLevel: { type: Number, default: 1 }, // Legacy field, keeping for compatibility
  languageLevels: { type: Map, of: Number, default: {} }, // Tracks current level per language
  badges: [{
    name: String,
    icon: String,
    description: String,
    dateEarned: { type: Date, default: Date.now }
  }],
  focusAreas: [{
    rule: String, // Technical name for AI consistency (in English)
    displayName: String, // Localized name for UI (e.g. Hindi script)
    displayDescription: String, // Localized description for UI
    language: { type: String, default: 'English' },
    level: { type: Number, default: 0 },
    masteryScore: { type: Number, default: 0 },
    isFocused: { type: Boolean, default: true },
    addedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('User', userSchema);
