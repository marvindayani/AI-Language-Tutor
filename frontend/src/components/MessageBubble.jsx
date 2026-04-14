import React from 'react';
import CorrectionBox from './CorrectionBox.jsx';
import { Bot, User } from 'lucide-react';

const MessageBubble = ({ message }) => {
  const isAi = message.role === 'ai';

  // ✅ New: Highlight incorrect text in user messages
  const renderText = (text, corrections, role) => {
    if (role !== 'user' || !corrections || corrections.length === 0) {
      return <p className="leading-relaxed whitespace-pre-wrap text-sm md:text-base">{text}</p>;
    }

    // Sort corrections by length descending to handle overlapping phrases
    const sortedCorrections = [...corrections].sort((a, b) => b.incorrect.length - a.incorrect.length);

    let parts = [text];

    sortedCorrections.forEach(corr => {
      const newParts = [];
      parts.forEach(part => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }

        const regex = new RegExp(`(${corr.incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const snippets = part.split(regex);

        snippets.forEach((snippet, idx) => {
          if (idx % 2 === 1) { // This is the match
            newParts.push(
              <span
                key={`${corr.incorrect}-${idx}`}
                className="bg-red-400/30 text-white underline decoration-red-400 decoration-2 underline-offset-2 rounded-sm px-0.5"
                title={`Suggestion: ${corr.correct}`}
              >
                {snippet}
              </span>
            );
          } else if (snippet !== '') {
            newParts.push(snippet);
          }
        });
      });
      parts = newParts;
    });

    return (
      <p className="leading-relaxed whitespace-pre-wrap text-sm md:text-base">
        {parts}
      </p>
    );
  };

  return (
    <div className={`flex gap-3 max-w-[85%] ${isAi ? 'self-start' : 'self-end flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isAi ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
        {isAi ? <Bot size={18} /> : <User size={18} />}
      </div>

      <div className="flex flex-col w-full relative">
        <div className={`px-4 py-3 rounded-2xl shadow-sm ${isAi
            ? 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
            : 'bg-indigo-600 text-white rounded-tr-sm mx-auto w-fit mr-0 shadow-indigo-200'
          }`}>
          {renderText(message.text, message.corrections, message.role)}
        </div>

        {isAi && message.fullCorrection && (
          <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm text-sm">
            <div className="flex items-center gap-2 text-emerald-700 font-bold mb-1">
              <span className="p-1 bg-emerald-100 rounded-lg">✨</span>
              A Better Way to Say This:
            </div>
            <p className="text-emerald-900 font-medium italic">"{message.fullCorrection}"</p>
          </div>
        )}

        {isAi && message.corrections && message.corrections.length > 0 && (
          <div className="flex flex-col gap-2 mt-1 w-full max-w-sm">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2 ml-1">Mistake Breakdown</h4>
            {message.corrections.map((corr, idx) => (
              <CorrectionBox
                key={idx}
                incorrect={corr.incorrect}
                correct={corr.correct}
                explanation={corr.explanation}
                grammarRule={corr.grammarRule}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
