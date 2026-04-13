import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.js';
import userRoutes from './routes/user.js';
import quizRoutes from './routes/quiz.js';
import authRoutes from './routes/auth.js';
import assessmentRoutes from './routes/assessment.js';
import learningRoutes from './routes/learning.routes.js';



dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/learning', learningRoutes);

// Error Default Route
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-language-tutor';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.error('MongoDB connection error:', err));
