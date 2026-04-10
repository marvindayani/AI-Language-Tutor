import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Globe, BarChart, BookOpen, LogOut, Award, ChevronRight, Flame, Star, ShieldCheck, Plane, Trophy, Map, MessageSquare, Headphones, Zap } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation */}
      <nav className="px-6 py-4 flex justify-between items-center bg-white border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#1421AC] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/10">
            <Sparkles size={20} />
          </div>
          <span className="text-xl font-black tracking-tighter talkpal-gradient-text uppercase">Language Hub</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-orange-50 text-orange-600 font-bold border border-orange-100">
            <Flame size={18} fill="currentColor" />
            <span>{user?.streakCount || 0}</span>
          </div>
          <button onClick={logoutUser} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                Welcome back, <span className="talkpal-gradient-text">{user?.name || 'Explorer'}</span>!
              </h1>
              <p className="text-slate-500 font-medium">Ready to continue your {language} journey today? 🚀</p>
            </div>
            
            <div className="flex gap-4">
               <div className="p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="flex flex-col pl-3">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Language</span>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)}
                      className="text-sm font-bold bg-transparent border-none p-0 focus:ring-0 cursor-pointer">
                      {['Spanish', 'French', 'German', 'Japanese', 'Italian', 'Hindi', 'English'].map(lang => (
                        <option key={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-px h-8 bg-slate-100" />
                  <div className="flex flex-col pr-3">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Level</span>
                    <select value={level} onChange={(e) => setLevel(e.target.value)}
                      className="text-sm font-bold bg-transparent border-none p-0 focus:ring-0 cursor-pointer">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
               </div>
            </div>
          </motion.div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Modes */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Daily Pick Section */}
            <section>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Daily Practice</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Text Chat Card */}
                <button onClick={handleStartSession} className="talkpal-card p-6 text-left group">
                  <div className="w-12 h-12 bg-indigo-50 text-[#1421AC] rounded-2xl flex items-center justify-center mb-4 transition-colors group-hover:bg-[#1421AC] group-hover:text-white">
                    <MessageSquare size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Active Chat</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-4">Master natural conversation through text-based dialogue.</p>
                  <div className="flex items-center text-[#1421AC] font-bold text-sm">
                    Start Chat <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>

                {/* Questions Card */}
                <button onClick={handleStartQuiz} className="talkpal-card p-6 text-left group">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                    <BookOpen size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Practice Hub</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-4">Test your grammar and vocabulary with interactive quizzes.</p>
                  <div className="flex items-center text-emerald-600 font-bold text-sm">
                    Enter Hub <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              </div>
            </section>

            {/* Immersive Section */}
            <section>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Advanced Immersions</h2>
              <button 
                onClick={() => navigate('/roleplay-setup', { state: { language, level } })}
                className="w-full talkpal-card p-1 pb-1 overflow-hidden group border-none bg-gradient-to-br from-[#1421AC] to-[#4F46E5]"
              >
                <div className="bg-white rounded-[31px] p-8 flex flex-col md:flex-row items-center gap-8 group-hover:bg-white/95 transition-all">
                  <div className="w-20 h-20 bg-blue-50 text-[#1421AC] rounded-3xl flex items-center justify-center shrink-0">
                    <Zap size={40} strokeWidth={2.5} className="animate-pulse" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-2xl font-black mb-2">Immersive Voice Roleplay</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Transform your speaking skills by roleplaying real-world scenarios in {language}. 
                      Speak naturally and get instant AI feedback.
                    </p>
                  </div>
                  <div className="talkpal-button-primary shrink-0 flex items-center gap-2">
                    Let's Speak <Headphones size={20} />
                  </div>
                </div>
              </button>
            </section>

          </div>

          {/* Right Column - Stats & Progress */}
          <div className="space-y-8">
            
            {/* Progress Card */}
            <section className="talkpal-card p-8 bg-slate-900 border-none relative overflow-hidden">
               {/* Background Glow */}
               <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full" />
               <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full" />
               
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-white text-lg font-bold">Your Progress</h2>
                    <Award size={24} className="text-indigo-400" />
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                         <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Milestone Progress</p>
                         <p className="text-white font-bold text-sm">
                           {user?.sessionsCompleted % 5}/5 <span className="text-slate-500 font-medium">sessions</span>
                         </p>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(user?.sessionsCompleted % 5) * 20}%` }}
                          className="bg-indigo-500 h-2 rounded-full shadow-[0_0_15px_rgb(99,102,241,0.5)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={() => navigate('/progress')} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl transition-colors text-center">
                         <BarChart size={20} className="text-indigo-400 mx-auto mb-2" />
                         <span className="text-xs text-white font-bold">Analytics</span>
                       </button>
                       <button onClick={() => navigate('/leaderboard')} className="bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl transition-colors text-center">
                         <Trophy size={20} className="text-amber-400 mx-auto mb-2" />
                         <span className="text-xs text-white font-bold">Ranking</span>
                       </button>
                    </div>

                    {/* Assessment Trigger */}
                    {user?.sessionsCompleted >= 5 && (
                      <div className="pt-2">
                        {(!latestAssessment || latestAssessment.milestone < Math.floor(user.sessionsCompleted / 5) * 5) ? (
                          <button
                            onClick={handleManualAssessment}
                            disabled={generatingAssessment}
                            className="w-full talkpal-button-primary flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 shadow-amber-900/10"
                          >
                            {generatingAssessment ? "Analyzing..." : <><Award size={18} /> Generate Milestone</>}
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate('/level-report')}
                            className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all"
                          >
                            <Award size={18} /> View Latest Report <ChevronRight size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
               </div>
            </section>

            {/* Achievements Section */}
            <section className="talkpal-card p-8">
               <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <Trophy size={14} /> Milestones
               </h2>
               <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "First Step", icon: Map },
                  { name: "3-Day Warrior", icon: Flame },
                  { name: "7-Day Legend", icon: Award },
                  { name: "Quiz Whiz", icon: Star },
                  { name: "Frequent Flyer", icon: Plane },
                  { name: "Grammar Guru", icon: ShieldCheck }
                ].map((badgeInfo, idx) => {
                  const earnedBadge = user?.badges?.find(b => b.name === badgeInfo.name);
                  const isLocked = !earnedBadge;
                  const Icon = badgeInfo.icon;

                  return (
                    <div key={idx} className="group relative">
                      <div className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 ${isLocked ? 'bg-slate-50 border border-slate-100 text-slate-300 opacity-60' : 'bg-amber-50 border border-amber-100 text-amber-500 hover:scale-110 shadow-lg shadow-amber-900/5 cursor-help'}`}>
                        <Icon size={24} fill={!isLocked && (badgeInfo.icon === Flame || badgeInfo.icon === Award) ? "currentColor" : "none"} />
                      </div>
                      
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-40 p-3 bg-slate-900 text-white text-[11px] rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 text-center shadow-2xl">
                        <p className="font-bold border-b border-white/10 pb-2 mb-2 uppercase tracking-tighter">{isLocked ? "Locked" : badgeInfo.name}</p>
                        <p className="opacity-70 leading-relaxed font-medium">{isLocked ? "Keep practicing to unlock this milestone!" : earnedBadge.description}</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                      </div>
                    </div>
                  );
                })}
               </div>
            </section>

          </div>
        </div>
      </main>
      
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-[#1421AC] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="talkpal-gradient-text font-black text-lg animate-pulse">Personalizing your experience...</p>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
