import React, { useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Coffee, Plane, Briefcase, MapIcon, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import BASE_URL from '../config';

const scenarios = [
  { id: 'cafe', title: 'At a Cafe', description: 'Order a coffee, ask about pastries, and handle the bill.', icon: <Coffee size={32} /> },
  { id: 'airport', title: 'Airport Check-in', description: 'Navigate check-in, baggage drop, and security questions.', icon: <Plane size={32} /> },
  { id: 'interview', title: 'Job Interview', description: 'Answer common interview questions and discuss your skills.', icon: <Briefcase size={32} /> },
  { id: 'directions', title: 'Asking Directions', description: 'Get lost in a new city and ask locals for help finding a landmark.', icon: <MapIcon size={32} /> },
];

const RoleplaySetup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { language, level } = location.state || {};
  const { token } = useContext(AuthContext);

  if (!language) {
    navigate('/');
    return null;
  }

  const handleSelectScenario = async (scenarioTitle) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/chat/session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ language, level, scenario: scenarioTitle })
      });
      const data = await res.json();
      if (data.session) {
        navigate(`/voice/${data.session._id}`, { state: { scenario: scenarioTitle }});
      }
    } catch (err) {
      console.error(err);
      alert('Failed to start scenario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
        </button>
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">Choose a Scenario</h1>
          <p className="mt-2 text-lg text-gray-600">
            Immersive voice practice for <span className="font-semibold text-indigo-600">{language}</span> ({level}).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map((s) => (
            <div 
              key={s.id} 
              onClick={() => handleSelectScenario(s.title)}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-300 hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden flex flex-col items-center text-center"
            >
              {loading && <div className="absolute inset-0 bg-white/50 z-10" />}
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                {s.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-600 text-sm">{s.description}</p>
            </div>
          ))}
        </div>
        {/* {loading && <p className="text-center text-indigo-600 mt-8 font-medium animate-pulse">Setting up your immersive environment...</p>} */}
      </div>
    </div>
  );
};

export default RoleplaySetup;
