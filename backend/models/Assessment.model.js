import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  language: { type: String, required: true },
  cefrLevel: { type: String, required: true, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
  milestone: { type: Number, required: true }, // e.g. 5, 10, 15
  report: { type: String, required: true },
  strengths: [String],
  weaknesses: [String],
  nextSteps: [String],
  sessionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }]
}, { timestamps: true });

export default mongoose.model('Assessment', assessmentSchema);
