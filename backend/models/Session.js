import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  language: { type: String, required: true },
  level: { type: String, required: true, enum: ['beginner', 'intermediate', 'advanced'] },
  scenario: { type: String, default: null }, // Used for Immersive Roleplay Mode
  focusRule: { type: String, default: null }, // Specific grammar focus for the session
  summary: {
    mistakes: [String],
    vocabulary: [String],
    tips: [String],
    overallFeedback: String
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Session', sessionSchema);
