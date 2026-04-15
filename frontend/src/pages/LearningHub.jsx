import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, BookOpen, Target, Brain, Plus, X, GraduationCap, Zap, CheckCircle2, Mic, MessageSquare, Lock, ChevronRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import BASE_URL from '../config';

const LearningHub = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [focusAreas, setFocusAreas] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [curriculum, setCurriculum] = useState({});
  const [newRule, setNewRule] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [generatingStarter, setGeneratingStarter] = useState(false);

  const [activeLesson, setActiveLesson] = useState(null);
  const [loadingLesson, setLoadingLesson] = useState(false);

  useEffect(() => {
    if (token) fetchFocusAreas();
  }, [token, navigate]); // Added navigate to ensure refresh on route returns

  const fetchFocusAreas = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/learning/focus-areas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setFocusAreas(data.focusAreas || []);
      setCurrentLevel(data.currentLevel || 1);
      setCurriculum(data.curriculum || {});
    } catch (err) {
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleGenerateStarterPack = async () => {
    setGeneratingStarter(true);
    try {
      const res = await fetch(`${BASE_URL}/api/learning/starter-pack`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFocusAreas(data.focusAreas);
      setCurrentLevel(data.currentLevel);
    } catch (err) {
      console.error(err);
      alert("Failed to initialize curriculum: " + err.message);
    } finally {
      setGeneratingStarter(false);
    }
  };

  const handleAddFocusArray = async (e) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/api/learning/focus-areas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ rule: newRule })
      });
      const data = await res.json();
      setFocusAreas(data.focusAreas);
      setNewRule('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateLesson = async (rule) => {
    setLoadingLesson(true);
    setActiveLesson(null);
    try {
      const res = await fetch(`${BASE_URL}/api/learning/lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ rule })
      });
      const data = await res.json();
      setActiveLesson({ ...data, rule });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLesson(false);
    }
  };

  const handleStartTargetedQuiz = async (rule) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/quiz/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ language: user?.language || 'English', level: user?.level || 'beginner', focusRule: rule })
      });
      const data = await res.json();
      if (data.quiz) navigate(`/quiz/${data.quiz._id}`, { state: { quiz: data.quiz } });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInteractivePractice = async (rule) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/chat/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          language: user?.language || 'English',
          level: user?.level || 'beginner',
          focusRule: rule
        })
      });
      const data = await res.json();
      if (data.session) {
        navigate(`/voice/${data.session._id}`, { state: { focusRule: rule } });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to start practice session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation */}
      <nav className="px-6 py-4 flex justify-between items-center bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/10">
            <GraduationCap size={20} />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-800 uppercase">Learning Hub</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Grammar Focus Areas</h1>
          <p className="text-slate-500 mt-2 font-medium">Drill down into specific rules, master them, and rank up your language fluency.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Learning Path */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Target size={16} /> Your Progress
              </h2>
              {!initialLoading && Object.keys(curriculum).length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-1000"
                      style={{ width: `${(currentLevel / Object.keys(curriculum).length) * 100}%` }}
                    />
                  </div>
                  <span className="text-lg font-black text-slate-800">Level {currentLevel}</span>
                </div>
              )}
              {initialLoading && (
                <div className="flex items-center gap-4 animate-pulse">
                   <div className="flex-1 bg-slate-200 h-3 rounded-full" />
                   <div className="w-10 bg-slate-200 h-6 rounded-md" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              {Object.keys(curriculum).map((lvl) => {
                const levelNum = parseInt(lvl);
                const isLocked = levelNum > currentLevel;
                const topics = curriculum[lvl];

                return (
                  <div key={lvl} className={`bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-sm transition-all ${isLocked ? 'opacity-60 grayscale' : ''}`}>
                    <div className={`px-6 py-4 border-b border-slate-50 flex items-center justify-between ${levelNum === currentLevel ? 'bg-emerald-50/50' : 'bg-slate-50/30'}`}>
                      <h2 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${levelNum === currentLevel ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {isLocked ? <Lock size={14} /> : <CheckCircle2 size={14} />} Level {levelNum}
                      </h2>
                      {levelNum === currentLevel && (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Active</span>
                      )}
                    </div>
                    <div className="divide-y divide-slate-50">
                      {topics.map((topic, i) => {
                        const userArea = focusAreas.find(fa => 
                          fa.rule?.toLowerCase() === topic.rule?.toLowerCase()
                        );
                        const mastery = userArea?.masteryScore || 0;

                        return (
                          <button
                            key={i}
                            disabled={isLocked}
                            onClick={() => handleGenerateLesson(topic.rule)}
                            className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group ${activeLesson?.rule === topic.rule ? 'bg-emerald-50/30' : ''}`}
                          >
                            <div className="flex-1">
                              <h3 className="font-bold text-slate-800 text-sm">
                                {topic.displayName || userArea?.displayName || topic.rule}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 max-w-[100px] bg-slate-100 rounded-full h-1 overflow-hidden">
                                  <div className="bg-emerald-500 h-full" style={{ width: `${mastery}%` }} />
                                </div>
                                <span className="text-[9px] font-bold text-slate-400">{mastery}%</span>
                              </div>
                            </div>
                            {!isLocked && <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>


            {/* Custom Topics Section */}
            {focusAreas.some(fa => fa.level === 0) && (
              <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/20 text-xs font-black text-slate-400 uppercase tracking-widest">
                  Custom Practice
                </div>
                <div className="divide-y divide-slate-50">
                  {focusAreas.filter(fa => fa.level === 0).map((area) => (
                    <button
                      key={area._id}
                      onClick={() => handleGenerateLesson(area.rule)}
                      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group ${activeLesson?.rule === area.rule ? 'bg-emerald-50/30' : ''}`}
                    >
                      <h3 className="font-bold text-slate-800 text-sm">{area.rule}</h3>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleAddFocusArray} className="flex gap-2">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="Add custom topic..."
                className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <button disabled={!newRule.trim()} type="submit" className="bg-slate-100 text-slate-600 p-3 rounded-2xl hover:bg-slate-200 transition-colors disabled:opacity-50">
                <Plus size={20} />
              </button>
            </form>
          </div>

          {/* Right Column: AI Micro-Lesson */}
          <div className="lg:col-span-2">
            {loadingLesson ? (
              <div className="h-96 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-emerald-600 font-black tracking-tight animate-pulse">Generating custom lesson...</p>
              </div>
            ) : activeLesson ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />

                <h2 className="text-2xl font-black text-emerald-950 mb-2">{activeLesson.title}</h2>
                <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest rounded-lg mb-6">
                  {activeLesson.rule}
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Explanation</h3>
                    <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 p-5 rounded-2xl">
                      {activeLesson.explanation}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Key Examples</h3>
                    <div className="space-y-3">
                      {activeLesson.examples?.map((ex, i) => (
                        <div key={i} className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 flex flex-col sm:flex-row sm:items-center gap-3">
                          <span className="font-bold text-emerald-900 text-lg flex-1">{ex.target}</span>
                          <span className="text-slate-500 font-medium text-sm flex-1">— "{ex.english}"</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {activeLesson.tip && (
                    <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                      <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1"><Zap size={14} /> Pro Tip</h3>
                      <p className="text-amber-900 font-bold text-sm leading-relaxed">{activeLesson.tip}</p>
                    </div>
                  )}
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4">
                  <button
                    onClick={() => handleStartInteractivePractice(activeLesson.rule)}
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20 group"
                  >
                    Speak & Practice <Mic size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => handleStartTargetedQuiz(activeLesson.rule)}
                    className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-colors group"
                  >
                    Take Targeted Quiz <BookOpen size={20} className="group-hover:rotate-12 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 p-8 text-center border-2 border-dashed border-slate-200 rounded-[32px]">
                <Brain size={48} className="mb-4 opacity-50" />
                <h3 className="font-bold text-lg text-slate-500 mb-1">Select a Focus Area</h3>
                <p className="font-medium text-sm">Click any grammar rule on the left to instantly generate a custom lesson and targeted practice right here.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-900 font-black text-lg animate-pulse">Building your learning session...</p>
        </div>
      )}
    </div>
  );
};

export default LearningHub;
;
