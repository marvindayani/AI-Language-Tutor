import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, BookOpen, AlertTriangle, Lightbulb } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const SessionSummary = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (token && id) {
      fetch(`http://localhost:5000/api/chat/session/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setSession(data.session))
        .catch(err => console.error(err));
    }
  }, [id, token]);

  if (!session || !session.summary) {
    return <div className="h-screen flex items-center justify-center text-gray-500 animate-pulse">Analyzing conversation history...</div>;
  }

  const { summary } = session;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-sm border border-green-200 mb-4">
            <Award size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Session Complete!</h1>
          <p className="mt-2 text-lg text-gray-600">Here's your performance breakdown.</p>
        </div>

        <div className="bg-white px-6 py-8 rounded-2xl shadow-xl shadow-indigo-50 border border-gray-100 space-y-8">
          
          <div>
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Overall Feedback</h3>
            <p className="mt-3 text-gray-700 leading-relaxed bg-indigo-50/50 p-4 rounded-xl border border-indigo-50/50">{summary.overallFeedback}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-50/50 p-5 rounded-xl border border-red-100/50">
              <h3 className="text-base font-bold text-red-800 flex items-center gap-2 mb-3">
                <AlertTriangle size={18} /> Key Mistakes Made
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-red-900/80">
                {summary.mistakes?.length > 0 ? summary.mistakes.map((m, i) => <li key={i}>{m}</li>) : <li>No major mistakes! Great job!</li>}
              </ul>
            </div>

            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100/50">
              <h3 className="text-base font-bold text-blue-800 flex items-center gap-2 mb-3">
                <BookOpen size={18} /> New Vocabulary
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-blue-900/80">
                {summary.vocabulary?.length > 0 ? summary.vocabulary.map((v, i) => <li key={i} className="font-medium">{v}</li>) : <li>No new vocabulary added.</li>}
              </ul>
            </div>
          </div>

          <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100/50">
             <h3 className="text-base font-bold text-amber-800 flex items-center gap-2 mb-3">
                <Lightbulb size={18} /> Actionable Tips
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-amber-900/80">
                {summary.tips?.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
          </div>

        </div>

        <div className="text-center">
          <Link to="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors">
            Start Another Session
          </Link>
        </div>
      </div>
    </div>
  );
};
export default SessionSummary;
