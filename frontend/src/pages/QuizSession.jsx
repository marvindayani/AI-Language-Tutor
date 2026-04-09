import React, { useState, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight, Award, BookOpen, ArrowLeft, Volume2, RotateCcw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { AuthContext } from '../context/AuthContext';

const QuizSession = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const quiz = state?.quiz;
  const { token } = useContext(AuthContext);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState([]); // track wrong answers for review
  const [showReview, setShowReview] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per question

  if (!quiz) return <div className="min-h-screen flex items-center justify-center">No quiz found</div>;

  const question = quiz.questions[currentIdx];
  const isLast = currentIdx === quiz.questions.length - 1;
  const isFinished = currentIdx >= quiz.questions.length;

  // Timer logic
  useEffect(() => {
    if (isFinished || isSubmitted) return;
    
    if (timeLeft === 0) {
      handleCheck(); // Auto-submit if time runs out
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isFinished, isSubmitted]);

  const handleSelect = (idx) => {
    if(!isSubmitted) setSelectedOption(idx);
  }

  const handleCheck = () => {
    if(selectedOption === null) return;
    if(selectedOption === question.correctAnswerIndex) {
      setScore(s => s + 1);
      setCorrectCount(c => c + 1);
    } else {
      // Add to mistakes for review
      setMistakes(m => [...m, { 
        ...question, 
        userAnswer: question.options[selectedOption],
        userAnswerIndex: selectedOption 
      }]);
    }
    setIsSubmitted(true);
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // map language (Spanish -> es, French -> fr, etc.)
    const langMap = {
      'Spanish': 'es-ES',
      'French': 'fr-FR',
      'German': 'de-DE',
      'Italian': 'it-IT',
      'Portuguese': 'pt-PT',
      'English': 'en-US'
    };
    utterance.lang    = langMap[quiz.language] || 'en-US';
    utterance.rate    = 0.9;
    utterance.pitch   = 1;
    window.speechSynthesis.speak(utterance);
  };

  const handleNext = async () => {
    if (isLast) {
      // submit quiz to backend
      const isCorrectLast = selectedOption === question.correctAnswerIndex;
      const finalScore    = score + (isCorrectLast ? 1 : 0);
      const finalCorrect  = correctCount + (isCorrectLast ? 1 : 0);
      const totalQ        = quiz.questions.length;
      
      try {
        await fetch('http://localhost:5000/api/quiz/submit', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({
            quizId        : quiz._id,
            score         : Math.round((finalScore / totalQ) * 100), // send as %
            totalQuestions: totalQ,
            correctAnswers: finalCorrect
          })
        });

        // Trigger confetti for high score!
        if ((finalScore / totalQ) >= 0.8) {
           confetti({
             particleCount: 150,
             spread: 70,
             origin: { y: 0.6 },
             colors: ['#6366f1', '#10b981', '#f59e0b']
           });
        }
      } catch (err) { console.error(err); };
      
      setCurrentIdx(i => i + 1);
    } else {
      setSelectedOption(null);
      setIsSubmitted(false);
      setTimeLeft(30); // Reset timer for next question
      setCurrentIdx(i => i + 1);
    }
  };

  if (isFinished) {
    const totalQ   = quiz.questions.length;
    const accuracy = totalQ > 0 ? Math.round((score / totalQ) * 100) : 0;
    
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award size={40} className="text-indigo-600" />
            </div>
            
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Quiz Complete!</h2>
            <p className="text-gray-500 mb-6 font-medium">Excellent effort, way to go!</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Score</p>
                  <p className="text-2xl font-black text-indigo-600">{score} <span className="text-sm font-medium text-indigo-300">/ {totalQ}</span></p>
               </div>
               <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Accuracy</p>
                  <p className="text-2xl font-black text-emerald-600">{accuracy}%</p>
               </div>
            </div>

            {mistakes.length > 0 && (
               <div className="mb-6">
                  <button 
                    onClick={() => setShowReview(!showReview)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-400" /> Review {mistakes.length} mistakes</span>
                    <ArrowRight size={18} className={`transform transition-transform ${showReview ? 'rotate-90' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showReview && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3 space-y-3"
                      >
                         {mistakes.map((m, idx) => (
                           <div key={idx} className="text-left p-4 bg-red-50/30 border border-red-100 rounded-xl">
                              <p className="text-sm font-bold text-gray-900 mb-1">{m.question}</p>
                              <div className="flex gap-4 mb-2">
                                <p className="text-[11px] text-red-600 font-bold uppercase tracking-tight">Your: {m.userAnswer}</p>
                                <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-tight">Correct: {m.options[m.correctAnswerIndex]}</p>
                              </div>
                              <p className="text-[12px] text-gray-500 leading-snug">{m.explanation}</p>
                           </div>
                         ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            )}

            <div className="space-y-3">
              <button onClick={() => window.location.reload()} className="w-full bg-gray-900 text-white rounded-xl py-3.5 font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-200 flex items-center justify-center gap-2">
                <RotateCcw size={18} /> Retake Quiz
              </button>
              <button onClick={() => navigate('/')} className="w-full bg-white text-gray-600 border-2 border-gray-100 rounded-xl py-3 font-bold hover:bg-gray-50 transition">
                Back to Dashboard
              </button>
            </div>
        </motion.div>
      </div>
    );
  }

  const progressPercent = ((currentIdx) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
         <div className="flex items-center justify-between mb-8">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-gray-900 transition-colors font-semibold group">
               <ArrowLeft size={18} className="mr-2 transform group-hover:-translate-x-1 transition-transform" /> Exit
            </button>
            <div className="text-right">
               <h1 className="text-xl font-black text-gray-900 tracking-tight">{quiz.language} Quiz</h1>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{quiz.level}</p>
            </div>
         </div>

         {/* Animated Progress Bar */}
         <div className="mb-8 relative pt-1">
               <div className="flex items-center gap-6">
                  <div className="flex-1">
                     <span className="text-xs font-black inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-100">
                       Question {currentIdx + 1}
                     </span>
                  </div>
                  {/* Timer Display */}
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${timeLeft <= 5 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                     <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${timeLeft <= 5 ? 'bg-red-500' : 'bg-gray-400'}`} />
                     <span className="text-xs font-black tabular-nums">{timeLeft}s</span>
                  </div>
                  <div className="text-right">
                     <span className="text-xs font-black inline-block text-gray-400">
                       {Math.round(progressPercent)}% Complete
                     </span>
                  </div>
               </div>
            <div className="overflow-hidden h-2.5 mb-4 text-xs flex rounded-full bg-gray-200">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${progressPercent}%` }}
                 transition={{ duration: 0.5, ease: "easeOut" }}
                 className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 rounded-full"
               ></motion.div>
            </div>
         </div>
         
         <AnimatePresence mode="wait">
            <motion.div 
               key={currentIdx}
               initial={{ x: 20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               exit={{ x: -20, opacity: 0 }}
               className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8 md:p-10"
            >
               <div className="flex items-start justify-between mb-8 gap-4">
                  <h2 className="text-[22px] font-bold text-gray-900 leading-[1.4]">{question.question}</h2>
                  <button 
                    onClick={() => speak(question.question)}
                    className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors shadow-sm active:scale-95"
                    title="Hear pronunciation"
                  >
                    <Volume2 size={22} />
                  </button>
               </div>
               
               <div className="space-y-3.5">
                 {question.options.map((opt, idx) => {
                   let stateClass = "border-gray-100 hover:border-indigo-200 hover:bg-gray-50 text-gray-700";
                   
                   if (isSubmitted) {
                      if (idx === question.correctAnswerIndex) {
                        stateClass = "border-emerald-400 bg-emerald-50/50 text-emerald-800 font-bold ring-1 ring-emerald-400";
                      } else if (idx === selectedOption) {
                        stateClass = "border-red-400 bg-red-50/50 text-red-800 ring-1 ring-red-400";
                      } else {
                        stateClass = "border-gray-100 opacity-40";
                      }
                   } else if (selectedOption === idx) {
                      stateClass = "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/50 text-indigo-800 font-bold";
                   }

                   return (
                     <motion.div 
                       key={idx} 
                       whileHover={!isSubmitted ? { scale: 1.01 } : {}}
                       whileTap={!isSubmitted ? { scale: 0.99 } : {}}
                       onClick={() => handleSelect(idx)} 
                       className={`p-5 border-2 rounded-2xl cursor-pointer transition-all ${stateClass} flex items-center justify-between group`}
                     >
                       <span className="text-[16px]">{opt}</span>
                       <div className="flex items-center gap-3">
                         {!isSubmitted && (
                           <button 
                             onClick={(e) => { e.stopPropagation(); speak(opt); }}
                             className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-indigo-600 transition-all rounded-lg"
                           >
                             <Volume2 size={16} />
                           </button>
                         )}
                         {isSubmitted && idx === question.correctAnswerIndex && <CheckCircle size={22} className="text-emerald-500" />}
                         {isSubmitted && idx === selectedOption && idx !== question.correctAnswerIndex && <XCircle size={22} className="text-red-500" />}
                       </div>
                     </motion.div>
                   );
                 })}
               </div>

               <AnimatePresence>
                  {isSubmitted && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-10 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl"
                    >
                       <h4 className="font-black text-indigo-900 mb-2 uppercase tracking-tight text-xs flex items-center gap-2">
                         <div className="w-1.5 h-4 bg-indigo-400 rounded-full" /> Why this is correct?
                       </h4>
                       <p className="text-[15px] text-indigo-900/80 mb-5 leading-relaxed font-medium italic">{question.explanation}</p>
                       
                       {question.grammarRule && (
                         <div className="pt-5 border-t border-indigo-200/50">
                           <h4 className="font-black text-blue-900 mb-2 uppercase tracking-tight text-xs flex items-center gap-2">
                             <BookOpen size={14}/> Grammar Focus
                           </h4>
                           <div className="p-4 bg-white/60 rounded-2xl border border-white">
                             <p className="text-[14px] text-gray-800 leading-relaxed font-semibold">{question.grammarRule}</p>
                           </div>
                         </div>
                       )}
                    </motion.div>
                  )}
               </AnimatePresence>

               <div className="mt-10 pt-8 border-t border-gray-100 flex justify-end">
                 {!isSubmitted ? (
                   <button onClick={handleCheck} disabled={selectedOption === null}
                     className="px-10 py-3.5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 disabled:opacity-30 transition-all shadow-lg shadow-indigo-200 active:scale-95">
                     Verify Answer
                   </button>
                 ) : (
                   <button onClick={handleNext}
                     className="px-10 py-3.5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 active:scale-95">
                     {isLast ? "Reveal Results" : "Continue"} <ArrowRight size={18} />
                   </button>
                 )}
               </div>
            </motion.div>
         </AnimatePresence>
      </div>
    </div>
  );
};
export default QuizSession;
