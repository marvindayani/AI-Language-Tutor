import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  role: { type: String, enum: ['user', 'ai'], required: true },
  text: { type: String, required: true },
  fullCorrection: { type: String, default: null },
  corrections: [{
    incorrect: String,
    correct: String,
    explanation: String,
    grammarRule: String
  }]
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);
