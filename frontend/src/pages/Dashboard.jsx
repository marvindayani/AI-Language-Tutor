import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Globe, BarChart, BookOpen, LogOut, Award, ChevronRight, Flame, Star, ShieldCheck, Plane, Trophy, Map } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user, token, logoutUser } = useContext(AuthContext);

  const [language, setLanguage] = useState(user?.language || 'Spanish');
  const [level, setLevel] = useState(user?.level || 'beginner');
  const [loading, setLoading] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [generatingAssessment, setGeneratingAssessment] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setLanguage(user.language || 'English');
      setLevel(user.level || 'beginner');
      fetchLatestAssessment();
    }
  }, [user]);

  const fetchLatestAssessment = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/assessment/latest', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLatestAssessment(data.assessment);
    } catch (err) {
      console.error("Latest assessment error:", err);
    }
  };

  const handleManualAssessment = async () => {
    setGeneratingAssessment(true);
    try {
      const res = await fetch('http://localhost:5000/api/assessment/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.assessment) {
        setLatestAssessment(data.assessment);
        navigate(`/assessment/${data.assessment._id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAssessment(false);
    }
  };

  const handleStartSession = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/chat/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ language, level })
      });
      const data = await res.json();
      if (data.session) navigate(`/session/${data.session._id}`);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleStartQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ language, level })
      });
      const data = await res.json();
      if (data.quiz) navigate(`/quiz/${data.quiz._id}`, { state: { quiz: data.quiz } });
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative">
        <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <Sparkles size={28} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 uppercase tracking-tighter">
          Language Hub
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Start your learning journey today!
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-indigo-50 sm:rounded-2xl sm:px-10 border border-gray-100 relative">

          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100 text-orange-600 shadow-sm animate-bounce-subtle">
            <Flame size={18} fill="currentColor" />
            <span className="text-sm font-black">{user?.streakCount || 0}</span>
          </div>

          <button
            onClick={logoutUser}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
            title="Sign Out"
          >
            <LogOut size={16} /> Logout
          </button>

          <div className="space-y-6 mt-10">

            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 transition-all duration-300">
              <div className="flex justify-between items-center mb-3">
                <div className="flex-1">
                  <p className="text-sm text-indigo-900 font-bold">Proficiency Milestone</p>
                  <p className="text-[11px] text-indigo-600 font-medium">
                    {user?.sessionsCompleted % 5 === 0 && user?.sessionsCompleted > 0
                      ? "5 / 5 sessions — Assessment Ready!"
                      : `${user?.sessionsCompleted % 5} / 5 sessions completed (${5 - (user?.sessionsCompleted % 5)} remaining)`}
                  </p>
                </div>
                <Award size={20} className="text-indigo-400" />
              </div>

              <div className="w-full bg-indigo-200/50 rounded-full h-1.5 mb-3">
                <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(user?.sessionsCompleted % 5) * 20}%` }}></div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/progress')}
                  className="text-[10px] uppercase tracking-wider font-black text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                >
                  <BarChart size={12} /> Progress
                </button>
                <button
                  onClick={() => navigate('/leaderboard')}
                  className="text-[10px] uppercase tracking-wider font-black text-amber-600 hover:text-amber-800 transition-colors flex items-center gap-1"
                >
                  <Trophy size={12} /> Leaderboard
                </button>

                {/* Assessment Display Logic */}
                {user?.sessionsCompleted >= 5 && (
                  <>
                    {(!latestAssessment || latestAssessment.milestone < Math.floor(user.sessionsCompleted / 5) * 5) ? (
                      <button
                        onClick={handleManualAssessment}
                        disabled={generatingAssessment}
                        className="text-[10px] uppercase tracking-wider font-black text-amber-600 hover:text-amber-800 transition-colors flex items-center gap-1 ml-auto animate-pulse"
                      >
                        {generatingAssessment ? "Analyzing..." : <><Award size={12} /> Milestone Report</>}
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/level-report')}
                        className="text-[10px] uppercase tracking-wider font-black text-emerald-600 hover:text-emerald-800 transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Award size={12} /> Assessment Report <ChevronRight size={10} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Globe size={16} className="text-gray-400" /> Target Language
              </label>
              <div className="mt-1">
                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border bg-white">
                  {['Spanish', 'French', 'German', 'Japanese', 'Italian', 'Hindi', 'English'].map(lang => (
                    <option key={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <BarChart size={16} className="text-gray-400" /> Proficiency Level
              </label>
              <div className="mt-1">
                <select value={level} onChange={(e) => setLevel(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border bg-white">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button type="button" onClick={handleStartSession} disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors">
                <Sparkles size={18} className="mr-2" /> Text Chat
              </button>

              <button type="button" onClick={handleStartQuiz} disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-indigo-200 rounded-lg shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors">
                {loading ? 'Thinking...' : <><BookOpen size={18} className="mr-2" /> Questions</>}
              </button>
            </div>

            <div className="pt-2">
              <button type="button" onClick={() => navigate('/roleplay-setup', { state: { language, level } })} disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 transition-all transform hover:-translate-y-0.5">
                <Globe size={20} className="mr-2 animate-pulse" /> Immersive Voice Roleplay
              </button>
            </div>

            {/* Achievements Section */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-3 flex items-center gap-2">
                <Trophy size={12} /> Achievements
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { name: "First Step", icon: Map, description: "Complete 1 session or quiz" },
                  { name: "3-Day Warrior", icon: Flame, description: "Active 3 days in a row" },
                  { name: "7-Day Legend", icon: Award, description: "Active 7 days in a row" },
                  { name: "Quiz Whiz", icon: Star, description: "Complete 5 quizzes" },
                  { name: "Frequent Flyer", icon: Plane, description: "Complete 10 sessions" },
                  { name: "Grammar Guru", icon: ShieldCheck, description: "95% accuracy over 20+ Qs" }
                ].map((badgeInfo, idx) => {
                  const earnedBadge = user?.badges?.find(b => b.name === badgeInfo.name);
                  const isLocked = !earnedBadge;
                  const Icon = badgeInfo.icon;

                  return (
                    <div
                      key={idx}
                      className="group relative"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${isLocked ? 'bg-gray-50 border border-gray-200 text-gray-300' : 'bg-amber-50 border border-amber-200 text-amber-600 hover:scale-110 cursor-help'}`}>
                        <Icon size={20} fill={!isLocked && (badgeInfo.icon === Flame || badgeInfo.icon === Award) ? "currentColor" : "none"} />
                      </div>

                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 text-center shadow-xl">
                        <p className="font-bold border-b border-white/10 pb-1 mb-1">{isLocked ? "Locked" : badgeInfo.name}</p>
                        <p className="opacity-80 leading-tight">{isLocked ? badgeInfo.description : earnedBadge.description}</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {loading && <p className="text-center text-xs text-gray-500 mt-2 animate-pulse">Generatin from AI resource...</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
