import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow.jsx';
import { Send, LogOut, Mic, MicOff, ArrowLeft, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const ActiveSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = React.useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]); // ✅ Store all past sessions
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = React.useRef(null);

  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setText(currentText);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = (e) => {
    e.preventDefault();
    if (!SpeechRecognition) return alert("Your browser doesn't support Voice APIs (Use Chrome/Edge).");
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {}
    }
  };

  // ✅ Fetch all user sessions for the sidebar
  useEffect(() => {
    const fetchAllSessions = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/chat/sessions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.sessions) {
          setSessions(data.sessions);
        }
      } catch (err) {
        console.error("Fetch all sessions error:", err);
      }
    };

    if (token) fetchAllSessions();
  }, [token, id]); // Re-fetch when token changes or a new session is started

  // ✅ Fetch current session messages
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/chat/session/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        console.log("Session Data:", data);

        if (res.ok && data?.messages) {
          setMessages(data.messages);
        } else {
          console.warn("No messages found");
        }
      } catch (err) {
        console.error("Fetch session error:", err);
      }
    };

    if (id && token) fetchSession();
  }, [id, token]);

  // ✅ Send message handler
  const handleSend = async (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    if (isRecording) {
      recognitionRef.current?.stop();
    }

    const userMsgText = text;

    // Clear input immediately
    setText('');

    // ✅ Add user message with _id
    const userMessage = {
      _id: Date.now().toString(),
      role: 'user',
      text: userMsgText
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      console.log("Sending:", userMsgText);

      const res = await fetch('http://localhost:5000/api/chat/message', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ sessionId: id, text: userMsgText })
      });

      const data = await res.json();

      console.log("Response:", data);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // ✅ Flexible AI message handling
      const aiMessage = data.aiMessage || data.message || {
        _id: Date.now().toString(),
        role: 'ai',
        text: "⚠️ No response from AI."
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      console.error("Send error:", err);

      // ✅ Error message in chat
      setMessages(prev => [
        ...prev,
        {
          _id: Date.now().toString(),
          role: 'ai',
          text: `⚠️ Error: ${err.message}`
        }
      ]);

    } finally {
      setIsTyping(false); // ✅ Always reset
    }
  };

  // ✅ Delete session handler
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation(); // Prevent navigating to the session
    
    if (!window.confirm("Are you sure you want to delete this chat history?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/chat/session/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        // Remove locally
        const updatedSessions = sessions.filter(s => s._id !== sessionId);
        setSessions(updatedSessions);
        
        // If current session is deleted, navigate to the first available session,
        // or go back to dashboard if no sessions are left.
        if (id === sessionId) {
          if (updatedSessions.length > 0) {
            navigate(`/session/${updatedSessions[0]._id}`);
          } else {
            navigate('/');
          }
        }
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to delete session");
      }
    } catch (err) {
      console.error("Delete session error:", err);
      alert("Error deleting session");
    }
  };

  const handleEndSession = async () => {
    setIsTyping(true);

    try {
      const res = await fetch(`http://localhost:5000/api/chat/session/${id}/end`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();

      console.log("End Session:", data);

      if (res.ok && data?.session) {
        navigate(`/session/${id}/summary`);
      } else {
        throw new Error("Failed to end session");
      }

    } catch (err) {
      console.error("End session error:", err);
      alert("Failed to end session");

    } finally {
      setIsTyping(false);
    }
  };
  return (
    <div className="flex h-screen bg-gray-50/50 w-full overflow-hidden">
      
      {/* Sidebar for User Questions */}
      <aside className="w-64 md:w-72 bg-white border-r border-gray-200 hidden md:flex flex-col shrink-0 overflow-hidden shadow-sm z-10">
        <div className="p-4 border-b border-gray-200 bg-gray-50/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-tight text-gray-500 uppercase">Chat History</h2>
            <button 
              onClick={() => navigate('/')}
              className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
              title="Start New Chat"
            >
              <Send size={14} className="rotate-[-45deg]" />
            </button>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            + New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-400 text-xs py-10 px-4">
              <p>No past conversations found.</p>
              <p className="mt-1">Start a new practice session!</p>
            </div>
          ) : (
            sessions.map((sess) => (
              <div key={sess._id} className="group relative">
                <button 
                  onClick={() => navigate(`/session/${sess._id}`)}
                  className={`w-full text-left p-3 rounded-xl text-sm transition-all border pr-10 ${
                    id === sess._id 
                      ? 'bg-indigo-50 border-indigo-100 text-indigo-700 font-medium' 
                      : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-100'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="truncate block">
                      {sess.language} Practice - {sess.level}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(sess.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {id === sess._id && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  )}
                </button>
                
                {/* Delete Button (Only visible on hover or if not active) */}
                <button
                  onClick={(e) => handleDeleteSession(e, sess._id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-transparent"
                  title="Delete Chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Container */}
      <div className="flex flex-col flex-1 h-screen w-full relative overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 -ml-2 rounded-lg hover:bg-gray-100" title="Go Back">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                Live Practice
              </h1>
              <p className="text-sm text-gray-500">
                Your AI tutor is actively analyzing your grammar.
              </p>
            </div>
          </div>

          <button
            onClick={handleEndSession}
            disabled={isTyping}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut size={16} /> End Session
          </button>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-hidden flex flex-col relative w-full pt-4">
          <ChatWindow messages={messages} isTyping={isTyping} />

          {/* Input */}
          <div className="bg-white border-t border-gray-200 p-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
            <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2 items-center">

              <button 
                type="button" 
                onClick={toggleRecording}
                className={`p-3 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                  isRecording 
                    ? 'bg-rose-100 text-rose-600 animate-pulse border border-rose-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                }`}
                title="Dictate with voice"
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type your message natively..."
                required
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
              />

              <button
                type="submit"
                disabled={!text.trim() || isTyping}
                className="px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center"
              >
                <Send size={18} />
              </button>

            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ActiveSession;