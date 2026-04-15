import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, ReferenceLine
} from 'recharts';
import { ArrowLeft, Book, MessageCircle, Star, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import BASE_URL from '../config';

const Progress = () => {
  const { token, user: authUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/user/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        }
      } catch (err) {
        console.error("Fetch stats error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-indigo-600 font-medium">Loading your progress analysis...</div>
      </div>
    );
  }

  const { 
    user, totalVocabulary, allVocabulary, commonMistakes, 
    performanceTrend, quizStats, accuracyTrend
  } = stats || {};

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 animate-in fade-in duration-700 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white rounded-lg shadow-sm transition-all border border-transparent hover:border-gray-200"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Your Learning Journey</h1>
            <p className="text-sm text-gray-500">Track your milestones and performance trends</p>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard 
            icon={<MessageCircle size={20} />} 
            label="Practice Sessions" 
            value={user?.sessionsCompleted || 0} 
            color="bg-blue-600" 
            delay="0"
          />
          <StatCard 
            icon={<Book size={20} />} 
            label="Quizzes Taken" 
            value={user?.quizzesTaken || 0} 
            color="bg-indigo-600" 
            delay="100"
          />
          <StatCard 
            icon={<Star size={20} />} 
            label="Performance Score" 
            value={user?.performanceScore || 0} 
            color="bg-amber-500" 
            delay="200"
          />
          <StatCard 
            icon={<TrendingUp size={20} />} 
            label="Words Learned" 
            value={totalVocabulary || 0} 
            color="bg-emerald-600" 
            delay="300"
          />
          <StatCard 
            icon={<Target size={20} />} 
            label="Accuracy Rate" 
            value={`${user?.accuracyRate ?? 0}%`} 
            color="bg-rose-500" 
            delay="400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Quiz Performance Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Star size={18} className="text-amber-500" /> Quiz Score History
            </h3>
            <div className="h-64 w-full">
              {quizStats?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quizStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{fontSize: 9, fontWeight: 600, fill: '#94a3b8'}} 
                      tickLine={false} 
                      axisLine={false} 
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tickFormatter={v => `${v}%`} 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{fontSize: 10, fill: '#94a3b8'}} 
                    />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-50 flex flex-col gap-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{payload[0].payload.date}</p>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-xs font-bold text-gray-600">{payload[0].payload.language}</span>
                                <span className="text-sm font-black text-indigo-600">{payload[0].value}%</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="score" fill="url(#colorScore)" radius={[6, 6, 0, 0]} barSize={24}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={1}/>
                          </linearGradient>
                        </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No quizzes completed yet." />
              )}
            </div>
          </div>

          {/* Performance Trend */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" /> Practice Activity
            </h3>
            <div className="h-64 w-full">
               {performanceTrend?.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={performanceTrend}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                     <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                     <YAxis hide />
                     <Tooltip 
                       contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                     />
                     <Line 
                        type="monotone" 
                        dataKey="sessions" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        dot={{fill: '#10b981', r: 4}} 
                        activeDot={{r: 6}}
                     />
                   </LineChart>
                 </ResponsiveContainer>
               ) : (
                 <EmptyState message="No practice sessions completed yet." />
               )}
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Mastered Vocabulary */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Book size={18} className="text-indigo-500" /> Mastered Vocabulary
            </h3>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {allVocabulary?.length > 0 ? (
                allVocabulary.map((word, idx) => (
                  <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100 italic">
                    {word}
                  </span>
                ))
              ) : (
                <EmptyState message="Start practicing to build your vocabulary!" />
              )}
            </div>
          </div>

          {/* Common Mistakes Review */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-500" /> Recent Mistakes to Review
            </h3>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {commonMistakes?.length > 0 ? (
                commonMistakes.map((mistake, idx) => (
                  <div key={idx} className="p-3 bg-rose-50 border-l-4 border-rose-400 text-rose-800 text-sm italic rounded-r-lg">
                    "{mistake}"
                  </div>
                ))
              ) : (
                <EmptyState message="No mistakes recorded. Excellent work!" />
              )}
            </div>
          </div>

        </div>

        {/* Accuracy Trend — full-width below the existing 2-col grid */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-8">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Target size={18} className="text-rose-500" /> Accuracy Trend Over Quizzes
          </h3>
          <div className="h-64 w-full">
            {accuracyTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tickLine={false} axisLine={false} tick={{fontSize: 10}} />
                  <Tooltip 
                    formatter={(v) => [`${v}%`, 'Accuracy']}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Target 80%', position: 'insideTopRight', fill: '#10b981', fontSize: 10 }} />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#f43f5e" 
                    strokeWidth={3} 
                    dot={{fill: '#f43f5e', r: 4}} 
                    activeDot={{r: 6}}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Complete quizzes to see your accuracy trend." />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, delay }) => (
  <div 
    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`p-3 rounded-xl text-white ${color} shadow-lg shadow-current/10`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
    </div>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="h-full flex items-center justify-center text-gray-400 text-sm italic py-10">
    {message}
  </div>
);

export default Progress;
