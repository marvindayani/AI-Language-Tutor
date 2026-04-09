import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  language: { type: String, required: true },
  level: { type: String, required: true },
  questions: [{
    question: String,
    options: [String],
    correctAnswerIndex: Number,
    explanation: String,
    grammarRule: String
  }],
  score: { type: Number, default: 0 },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
