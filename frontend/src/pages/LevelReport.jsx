import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, CheckCircle2, TrendingUp, Target, ArrowRight, Download, Share2, BookOpen } from 'lucide-react';
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!assessment) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
    <Award size={64} className="text-gray-200 mb-4" />
    <h2 className="text-2xl font-bold text-gray-900 mb-2">No assessment found</h2>
    <p className="text-gray-500 mb-6">Complete 5 sessions to generate your first level report!</p>
    <button onClick={() => navigate('/')} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Back to Dashboard</button>
  </div>;

  const getLevelColor = (level) => {
    if (level.startsWith('A')) return 'from-emerald-400 to-emerald-600';
    if (level.startsWith('B')) return 'from-indigo-500 to-blue-600';
    return 'from-rose-500 to-orange-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-gray-900 mb-8 transition-colors font-semibold group">
           <ArrowLeft size={18} className="mr-2 transform group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100"
        >
          {/* Header Section */}
          <div className={`bg-gradient-to-br ${getLevelColor(assessment.cefrLevel)} p-10 md:p-16 text-white text-center relative overflow-hidden`}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Award size={200} />
            </div>
            
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="inline-block px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest mb-6">
               Official Proficiency Milestone
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter">Level {assessment.cefrLevel}</h1>
            <p className="text-xl md:text-2xl font-medium opacity-90 max-w-2xl mx-auto leading-relaxed">
              Based on your last 5 sessions, you are communicating at a <span className="font-black underline decoration-white/30 underline-offset-4">{assessment.cefrLevel}</span> proficiency in {assessment.language}.
            </p>
          </div>

          {/* Report Body */}
          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Main Report Column */}
              <div className="lg:col-span-2 space-y-10">
                <section>
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <BookOpen size={16} className="text-indigo-500" /> Professional Assessment
                   </h3>
                   <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 italic text-gray-700 leading-relaxed font-medium">
                      "{assessment.report}"
                   </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <section className="bg-emerald-50/30 p-6 rounded-[32px] border border-emerald-100">
                      <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <CheckCircle2 size={16} /> Key Strengths
                      </h3>
                      <ul className="space-y-3">
                        {assessment.strengths.map((s, i) => (
                           <li key={i} className="text-sm font-bold text-gray-700 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 flex-shrink-0" />
                              {s}
                           </li>
                        ))}
                      </ul>
                   </section>

                   <section className="bg-amber-50/30 p-6 rounded-[32px] border border-amber-100">
                      <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <Target size={16} /> Focus Areas
                      </h3>
                      <ul className="space-y-3">
                        {assessment.weaknesses.map((w, i) => (
                           <li key={i} className="text-sm font-bold text-gray-700 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0" />
                              {w}
                           </li>
                        ))}
                      </ul>
                   </section>
                </div>
              </div>

              {/* Sidebar Next Steps */}
              <div className="space-y-6">
                 <section className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-100">
                    <TrendingUp size={32} className="mb-4 opacity-50" />
                    <h3 className="text-lg font-black mb-4 tracking-tight leading-tight">Your Path to the Next Level</h3>
                    <div className="space-y-4">
                       {assessment.nextSteps.map((step, i) => (
                          <div key={i} className="flex gap-3">
                             <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">{i+1}</div>
                             <p className="text-sm font-medium leading-snug">{step}</p>
                          </div>
                       ))}
                    </div>
                 </section>

                 {/* <div className="flex flex-col gap-2">
                    <button className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl text-gray-900 font-bold hover:bg-gray-50 transition-colors">
                       <span className="flex items-center gap-2"><Download size={18} className="text-gray-400" /> JSON Export</span>
                       <ArrowRight size={16} className="text-gray-300" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl text-gray-900 font-bold hover:bg-gray-50 transition-colors">
                       <span className="flex items-center gap-2"><Share2 size={18} className="text-gray-400" /> Share Achievement</span>
                       <ArrowRight size={16} className="text-gray-300" />
                    </button>
                 </div> */}
              </div>

            </div>
          </div>
        </motion.div>
        
        <p className="text-center text-gray-400 text-xs font-medium mt-10 tracking-widest uppercase">
           Level Reports are generated every 5 sessions. Generated on {new Date(assessment.createdAt).toLocaleDateString()}.
        </p>
      </div>
    </div>
  );
};

export default LevelReport;
