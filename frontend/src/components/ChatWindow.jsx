import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble.jsx';
import { Bot } from 'lucide-react';

const ChatWindow = ({ messages, isTyping }) => {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 w-full max-w-3xl mx-auto hide-scrollbar">
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
           <div className="p-4 bg-indigo-50 text-indigo-500 rounded-full mb-4">
             <Bot size={32} />
           </div>
           <p className="text-gray-500 text-lg">Your tutor is ready!</p>
           <p className="text-gray-400 text-sm mt-1">Send a message to begin the conversation.</p>
        </div>
      )}
      
      {messages.map((msg, i) => (
        <MessageBubble key={msg._id || i} message={msg} />
      ))}
      
      {isTyping && (
        <div className="flex gap-3 self-start">
           <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-sm shrink-0">
             <Bot size={18} />
           </div>
           <div className="px-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm rounded-tl-sm flex items-center gap-1">
             <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
             <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
             <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
           </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
};

export default ChatWindow;
