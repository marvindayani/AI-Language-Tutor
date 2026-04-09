import React from 'react';
import { XCircle, CheckCircle, Info, BookOpen } from 'lucide-react';

const CorrectionBox = ({ incorrect, correct, explanation, grammarRule }) => {
  return (
    <div className="mt-2 text-sm bg-red-50/80 border border-red-100 rounded-lg overflow-hidden shadow-sm">
      <div className="p-3 pb-0">
        <div className="flex items-start gap-2 text-red-700 font-medium mb-1">
          <XCircle size={16} className="mt-0.5" />
          <span>Incorrect: <span className="font-normal">{incorrect}</span></span>
        </div>
        <div className="flex items-start gap-2 text-green-700 font-medium mb-1">
          <CheckCircle size={16} className="mt-0.5" />
          <span>Correct: <span className="font-normal">{correct}</span></span>
        </div>
        <div className="flex items-start gap-2 text-blue-700 font-medium mt-2 pt-2 border-t border-red-100/50 pb-3">
          <Info size={16} className="mt-0.5 p-0" />
          <span>Explanation: <span className="font-normal">{explanation}</span></span>
        </div>
        {grammarRule && (
          <div className="flex items-start gap-2 text-indigo-700 font-medium mt-0 pt-3 border-t border-indigo-100/50 bg-indigo-50/50 -mx-3 p-3 rounded-b-lg">
            <BookOpen size={16} className="mt-0.5 shrink-0" />
            <span>Rule: <span className="font-normal">{grammarRule}</span></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorrectionBox;
