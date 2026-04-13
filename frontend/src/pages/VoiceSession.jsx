import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Mic, MicOff, Volume2, LogOut, Bot, User, ArrowLeft, Target } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

// Attempt to use web speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
// console.log("speech :",SpeechRecognition);

const VoiceSession = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = React.useContext(AuthContext);
  
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionInfo, setSessionInfo] = useState({ language: 'English' });
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    // Initial fetch to get session info (mainly language to configure speech)
    fetch(`http://localhost:5000/api/chat/session/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if(data.session) {
          setSessionInfo(data.session);
          if (data.messages) setMessages(data.messages);
        }
      })
      .catch(console.error);

    // Setup speech recognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      // We will set lang dynamically below
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }, [id]);

  useEffect(() => {
    if (recognitionRef.current && sessionInfo.language) {
      // Very rough mapping of languages to locale tags
      const langMap = {
        'Spanish': 'es-ES', 'French': 'fr-FR', 'German': 'de-DE', 
        'Japanese': 'ja-JP', 'Italian': 'it-IT', 'Hindi': 'hi-IN', 'English': 'en-US'
      };
      recognitionRef.current.lang = langMap[sessionInfo.language] || 'en-US';

      recognitionRef.current.onresult = (event) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [sessionInfo.language]);

  // Handle when recording automatically stops or user stops it manually
  useEffect(() => {
    if (!isRecording && transcript.trim().length > 0) {
      // Time to process the transcript!
      const userText = transcript;
      setTranscript('');
      handleSend(userText);
    }
  }, [isRecording]);

  const toggleRecording = () => {
    if (!SpeechRecognition) return alert("Your browser doesn't support Voice APIs (Use Chrome/Edge).");
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap = {
        'Spanish': 'es-ES', 'French': 'fr-FR', 'German': 'de-DE', 
        'Japanese': 'ja-JP', 'Italian': 'it-IT', 'Hindi': 'hi-IN', 'English': 'en-US'
      };
      utterance.lang = langMap[sessionInfo.language] || 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (text) => {
    if (!text.trim() || isProcessing) return;
    
    setMessages(prev => [...prev, { _id: Date.now(), role: 'user', text }]);
    setIsProcessing(true);

    try {
      const res = await fetch('http://localhost:5000/api/chat/message', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ sessionId: id, text })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed');
      
      const aiResponse = data.aiMessage || data.message;
      if (aiResponse) {
        setMessages(prev => [...prev, aiResponse]);
        speakText(aiResponse.text);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { _id: Date.now(), role: 'ai', text: `⚠️ Error: ${err.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndSession = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`http://localhost:5000/api/chat/session/${id}/end`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        navigate(`/session/${id}/summary`);
      } else {
        throw new Error();
      }
    } catch (err) {
      alert("Failed to end session");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transcript, isProcessing]);

  return (
    <div className="flex flex-col h-screen bg-indigo-900 text-white font-sans overflow-hidden relative">
      <header className="px-6 py-4 flex items-center justify-between border-b border-indigo-800 bg-indigo-950/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-indigo-200 hover:text-white transition-colors p-2 -ml-2 rounded-lg hover:bg-white/10" title="Go Back">
            <ArrowLeft size={20} />
          </button>
          <div>
             <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
               <Volume2 className="text-indigo-400" /> Immersive Roleplay
             </h1>
             <p className="text-sm text-indigo-300">
               {sessionInfo.focusRule ? (
                 <span className="flex items-center gap-1">
                   <Target size={14} className="text-emerald-400" /> Focus: <span className="font-semibold text-white">{sessionInfo.focusRule}</span>
                 </span>
               ) : (
                 <>Scenario: <span className="font-semibold text-white">{sessionInfo.scenario || 'Free Conversation'}</span></>
               )}
             </p>
          </div>
        </div>
        <button onClick={handleEndSession} disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-sm font-medium transition-colors border border-rose-500/20">
          <LogOut size={16} /> End Roleplay
        </button>
      </header>
      
      {sessionInfo.focusRule && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2 z-10">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
            <Target size={12} /> Today's Mission: Use "{sessionInfo.focusRule}" correctly in your response.
          </p>
        </div>
      )}
      
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 hide-scrollbar relative z-0">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-end pb-24">
          
          {messages.length === 0 && (
            <div className="text-center py-20 animate-fade-in text-indigo-200">
               <Bot size={48} className="mx-auto mb-4 opacity-50" />
               <h2 className="text-2xl font-bold text-white mb-2">Speak to Start!</h2>
               <p>Tap the microphone below and say hello in {sessionInfo.language}.</p>
            </div>
          )}

          {messages.map((msg, i) => (
             <div key={msg._id || i} className={`flex gap-4 mb-6 ${msg.role === 'ai' ? 'self-start' : 'self-end flex-row-reverse w-full max-w-lg'}`}>
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${msg.role === 'ai' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-gray-800 border border-gray-700 text-gray-400'}`}>
                  {msg.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className="flex flex-col flex-1">
                   {msg.role === 'ai' && <span className="text-xs uppercase tracking-wider text-indigo-400 mb-1 font-semibold ml-1">Native Tutor</span>}
                   {msg.role === 'user' && <span className="text-xs uppercase tracking-wider text-gray-500 mb-1 font-semibold mr-1 text-right">You</span>}
                   
                   <p className={`text-xl font-medium leading-relaxed ${msg.role === 'ai' ? 'text-white' : 'text-indigo-100 text-right'}`}>
                      {msg.text}
                   </p>
                   
                   {msg.corrections && msg.corrections.length > 0 && (
                     <div className="mt-4 p-4 bg-indigo-950/80 rounded-xl border border-indigo-800/50 flex flex-col gap-3 max-w-md">
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-wide">AI Correction</span>
                        {msg.corrections.map((c, idx) => (
                          <div key={idx} className="text-sm">
                            <p><span className="text-gray-400 line-through mr-2">{c.incorrect}</span> <span className="text-teal-400 font-semibold">{c.correct}</span></p>
                            <p className="text-indigo-200 mt-1 opacity-80">{c.explanation}</p>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
             </div>
          ))}

          {/* Active Speaking Indicator */}
          {transcript && (
            <div className="self-end flex-row-reverse w-full max-w-lg flex gap-4 mb-6 animate-pulse">
               <div className="w-10 h-10 shrink-0 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/50">
                  <User size={20} />
               </div>
               <div className="flex-1 text-right mt-2"><p className="text-xl font-medium text-white italic opacity-80">{transcript}</p></div>
            </div>
          )}
          
          {isProcessing && !transcript && (
            <div className="flex gap-4 mb-6 self-start animate-pulse text-indigo-400">
               <div className="w-10 h-10 shrink-0 rounded-full bg-indigo-800/50 border border-indigo-700/50 flex items-center justify-center">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></span>
               </div>
               <div className="flex items-center"><p className="text-lg">Tutor is thinking...</p></div>
            </div>
          )}
          
          <div ref={endRef} />
        </div>
      </main>

      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-indigo-950 to-transparent pointer-events-none z-10"></div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 w-64">
        <button 
          onClick={toggleRecording}
          disabled={isProcessing}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 pointer-events-auto ${
            isRecording 
              ? 'bg-rose-500 text-white shadow-rose-500/40 animate-pulse scale-110' 
              : 'bg-indigo-600 text-white shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-500'
          } disabled:opacity-50 disabled:scale-100 disabled:bg-gray-700`}
        >
          {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
        </button>
        <span className={`text-sm font-semibold tracking-wide uppercase transition-opacity ${isRecording ? 'text-rose-400' : 'text-indigo-300'} ${isProcessing ? 'opacity-0' : 'opacity-100'}`}>
          {isRecording ? 'Tap to finish' : 'Tap to speak'}
        </span>
      </div>
    </div>
  );
};
export default VoiceSession;
