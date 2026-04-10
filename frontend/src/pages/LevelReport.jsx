import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, CheckCircle2, TrendingUp, Target, ArrowRight, Download, Share2, BookOpen, Star, Sparkles, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const LevelReport = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessment();
  }, [id]);

  const fetchAssessment = async () => {
    try {
      const url = id ? `http://localhost:5000/api/assessment/${id}` : 'http://localhost:5000/api/assessment/latest';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAssessment(data.assessment);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <div className="w-16 h-16 border-4 border-[#1421AC] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="talkpal-gradient-text font-black animate-pulse">Analyzing Proficiency...</p>
    </div>
  );

  if (!assessment) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
         <Award size={48} />
      </div>
      <h2 className="text-3xl font-black text-slate-900 mb-2">No Report Found</h2>
      <p className="text-slate-500 max-w-sm mb-8 font-medium">Complete 5 more sessions to generate your next proficiency milestone report.</p>
      <button onClick={() => navigate('/')} className="talkpal-button-primary">Back to Dashboard</button>
    </div>
  );

  const getLevelStyles = (level) => {
    if (level.startsWith('A')) return { 
      bg: 'from-emerald-500 to-teal-600', 
      text: 'text-emerald-600', 
      label: 'Elementary Proficiency',
      icon: Star
    };
    if (level.startsWith('B')) return { 
      bg: 'from-[#1421AC] to-[#4F46E5]', 
      text: 'text-[#1421AC]', 
      label: 'Intermediate Proficiency',
      icon: ShieldCheck
    };
    return { 
      bg: 'from-rose-500 to-orange-600', 
      text: 'text-rose-600', 
      label: 'Advanced Mastery',
      icon: Sparkles
    };
  };

  const levelStyle = getLevelStyles(assessment.cefrLevel);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-400 hover:text-slate-900 mb-8 transition-colors font-bold group">
           <ArrowLeft size={18} className="mr-2 transform group-hover:-translate-x-1 transition-transform" /> Dashboard
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Main "Certificate" Card */}
          <div className="bg-white rounded-[48px] shadow-[0_32px_80px_rgb(0,0,0,0.06)] overflow-hidden border border-slate-100">
            
            {/* Header / Hero */}
            <div className={`bg-gradient-to-br ${levelStyle.bg} p-12 md:p-20 text-white relative overflow-hidden`}>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Award size={300} strokeWidth={1} />
                </div>
                <div className="absolute -bottom-24 -left-20 w-80 h-80 bg-white/10 blur-[100px] rounded-full" />
                
                <div className="relative z-10 flex flex-col items-center text-center">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 border border-white/20"
                    >
                       Professional Proficiency Milestone
                    </motion.div>
                    
                    <div className="flex items-center gap-6 mb-6">
                       <h1 className="text-7xl md:text-9xl font-black tracking-tighter drop-shadow-2xl">{assessment.cefrLevel}</h1>
                       <div className="text-left">
                          <p className="text-2xl md:text-3xl font-bold opacity-90">{assessment.language}</p>
                          <p className="text-sm font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                             <levelStyle.icon size={16} /> {levelStyle.label}
                          </p>
                       </div>
                    </div>
                    
                    <p className="text-lg md:text-xl font-medium max-w-2xl opacity-90 leading-relaxed italic">
                       "Successfully demonstrated consistent linguistic competency across various communicative scenarios."
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-8 md:p-16">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* Left: Detailed Report */}
                <div className="lg:col-span-2 space-y-12">
                   <section>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                         <BookOpen size={16} className={levelStyle.text} /> Linguistic Assessment
                      </h3>
                      <div className="glass-card p-10 rounded-[40px] border-none shadow-indigo-900/5">
                         <p className="text-slate-700 leading-relaxed font-semibold text-lg italic">
                            "{assessment.report}"
                         </p>
                      </div>
                   </section>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <section className="bg-emerald-50/40 p-8 rounded-[40px] border border-emerald-100/50">
                         <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <CheckCircle2 size={16} /> Key Strengths
                         </h3>
                         <ul className="space-y-4">
                           {assessment.strengths.map((s, i) => (
                              <li key={i} className="text-sm font-bold text-slate-700 flex items-start gap-3">
                                 <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <CheckCircle2 size={12} strokeWidth={3} />
                                 </div>
                                 {s}
                              </li>
                           ))}
                         </ul>
                      </section>

                      <section className="bg-amber-50/40 p-8 rounded-[40px] border border-amber-100/50 text-amber-900">
                         <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Target size={16} /> Growth Areas
                         </h3>
                         <ul className="space-y-4">
                           {assessment.weaknesses.map((w, i) => (
                              <li key={i} className="text-sm font-bold text-slate-700 flex items-start gap-3">
                                 <div className="w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-black text-[10px]">!</div>
                                 {w}
                              </li>
                           ))}
                         </ul>
                      </section>
                   </div>
                </div>

                {/* Right: Path to Mastery */}
                <div className="space-y-8">
                   <section className={`bg-gradient-to-br ${levelStyle.bg} p-10 rounded-[40px] text-white shadow-2xl shadow-indigo-900/10`}>
                      <TrendingUp size={40} className="mb-6 opacity-40 shrink-0" strokeWidth={2.5} />
                      <h3 className="text-2xl font-black mb-6 tracking-tight leading-tight">Your Path to the Next Level</h3>
                      <div className="space-y-6">
                         {assessment.nextSteps.map((step, i) => (
                            <div key={i} className="flex gap-4">
                               <div className="w-8 h-8 bg-white/20 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 border border-white/20">{i+1}</div>
                               <p className="text-sm font-bold leading-snug opacity-90">{step}</p>
                            </div>
                         ))}
                      </div>
                   </section>

                   <div className="grid grid-cols-2 gap-4">
                      <button className="talkpal-card p-4 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-[#1421AC]">
                         <Download size={20} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Download</span>
                      </button>
                      <button className="talkpal-card p-4 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-[#1421AC]">
                         <Share2 size={20} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Share</span>
                      </button>
                   </div>
                </div>

              </div>
            </div>
          </div>
          
          {/* Footer Timestamp */}
          <p className="text-center text-slate-300 text-[10px] font-black mt-12 tracking-[0.3em] uppercase">
             Generated on {new Date(assessment.createdAt).toLocaleDateString()} • {assessment.language} Hub v2.0
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LevelReport;
