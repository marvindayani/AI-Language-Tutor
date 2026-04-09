import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ActiveSession from './pages/ActiveSession.jsx';
import SessionSummary from './pages/SessionSummary.jsx';
import QuizSession from './pages/QuizSession.jsx';
import RoleplaySetup from './pages/RoleplaySetup.jsx';
import VoiceSession from './pages/VoiceSession.jsx';
import Progress from './pages/Progress.jsx';
import LevelReport from './pages/LevelReport.jsx';
import Leaderboard from './pages/Leaderboard.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/session/:id" element={<ProtectedRoute><ActiveSession /></ProtectedRoute>} />
          <Route path="/session/:id/summary" element={<ProtectedRoute><SessionSummary /></ProtectedRoute>} />
          <Route path="/quiz/:id" element={<ProtectedRoute><QuizSession /></ProtectedRoute>} />
          <Route path="/roleplay-setup" element={<ProtectedRoute><RoleplaySetup /></ProtectedRoute>} />
          <Route path="/voice/:id" element={<ProtectedRoute><VoiceSession /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
          <Route path="/level-report" element={<ProtectedRoute><LevelReport /></ProtectedRoute>} />
          <Route path="/assessment/:id" element={<ProtectedRoute><LevelReport /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
