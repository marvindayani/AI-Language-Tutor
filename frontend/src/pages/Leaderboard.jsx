import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Globe, MessageCircle, TrendingUp, Search, Crown } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Leaderboard = () => {
  const { token, user: currentUser } = useContext(AuthContext);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Global');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/user/leaderboard?language=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLeaderboard(data.leaderboard);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const TopThree = ({ users }) => (
    <div className="flex justify-center items-end gap-2 md:gap-8 mb-12 mt-8 h-64">
      {/* 2nd Place */}
      {users[1] && (
        <div className="flex flex-col items-center group">
          <div className="text-gray-400 mb-2 font-black text-xs uppercase animate-pulse">Silver</div>
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full border-4 border-gray-300 flex items-center justify-center text-gray-500 font-black text-2xl shadow-lg group-hover:scale-110 transition-transform">
             {users[1].name.charAt(0)}
          </div>
          <div className="h-28 w-20 md:w-24 bg-gradient-to-t from-gray-200 to-gray-50 rounded-t-2xl mt-4 flex flex-col items-center justify-end p-4 border-x border-t border-gray-200">
             <Medal size={24} className="text-gray-400 mb-2" />
             <span className="text-[10px] font-black text-gray-700 truncate w-full text-center">{users[1].name}</span>
             <span className="text-xs font-black text-gray-400">{users[1].performanceScore}</span>
          </div>
        </div>
      )}

      {/* 1st Place */}
      {users[0] && (
        <div className="flex flex-col items-center group -translate-y-4">
          <Crown className="text-amber-400 mb-2 animate-bounce" size={32} fill="currentColor" />
          <div className="w-20 h-20 md:w-28 md:h-28 bg-amber-50 rounded-full border-4 border-amber-400 flex items-center justify-center text-amber-600 font-black text-4xl shadow-xl group-hover:scale-110 transition-transform">
             {users[0].name.charAt(0)}
          </div>
          <div className="h-40 w-24 md:w-32 bg-gradient-to-t from-amber-100 to-amber-50 rounded-t-2xl mt-4 flex flex-col items-center justify-end p-6 border-x border-t border-amber-200 shadow-2xl shadow-amber-100">
             <Trophy size={32} className="text-amber-500 mb-3" />
             <span className="text-xs font-black text-amber-900 truncate w-full text-center">{users[0].name}</span>
             <span className="text-sm font-black text-amber-600">{users[0].performanceScore}</span>
          </div>
        </div>
      )}

      {/* 3rd Place */}
      {users[2] && (
        <div className="flex flex-col items-center group">
          <div className="text-orange-400 mb-2 font-black text-xs uppercase animate-pulse">Bronze</div>
          <div className="w-16 h-16 md:w-20 md:h-20 bg-orange-50 rounded-full border-4 border-orange-300 flex items-center justify-center text-orange-600 font-black text-2xl shadow-lg group-hover:scale-110 transition-transform">
             {users[2].name.charAt(0)}
          </div>
          <div className="h-20 w-20 md:w-24 bg-gradient-to-t from-orange-100 to-orange-50 rounded-t-2xl mt-4 flex flex-col items-center justify-end p-3 border-x border-t border-orange-200">
             <Medal size={20} className="text-orange-400 mb-1" />
             <span className="text-[10px] font-black text-gray-700 truncate w-full text-center">{users[2].name}</span>
             <span className="text-xs font-black text-orange-500">{users[2].performanceScore}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <header className="flex justify-between items-center mb-10 w-full">
           <button onClick={() => navigate('/')} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-100">
              <ArrowLeft size={20} />
           </button>
           <h1 className="text-2xl font-black text-gray-900 tracking-tighter flex items-center gap-2 uppercase">
              Hall of Fame
           </h1>
           <div className="w-10" />
        </header>

        {/* Filter Tabs */}
        <div className="bg-gray-200/50 p-1 rounded-2xl flex gap-1 mb-8">
           <button 
             onClick={() => setFilter('Global')}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'Global' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
           >
              <Globe size={14} /> Global
           </button>
           <button 
             onClick={() => setFilter(currentUser?.language || 'Spanish')}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter !== 'Global' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
           >
              <Search size={14} /> My Target
           </button>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Calculating Ranks...</p>
            </div>
        ) : (
          <>
            <TopThree users={leaderboard.slice(0, 3)} />

            <div className="space-y-3">
              {leaderboard.slice(3).map((user, idx) => (
                <div 
                  key={user._id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${user._id === currentUser?._id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:border-gray-200 shadow-sm hover:shadow-md'}`}
                >
                  <span className="w-6 text-xs font-black text-gray-400">#{idx + 4}</span>
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                        {user.name} 
                        {user._id === currentUser?._id && <span className="ml-2 text-[10px] text-indigo-600 font-black uppercase tracking-tighter">(You)</span>}
                    </p>
                    <div className="flex gap-3 mt-0.5">
                       <span className="text-[10px] font-black text-gray-400 uppercase">{user.language}</span>
                       <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-0.5">
                          <TrendingUp size={10} /> {user.accuracyRate}% Accuracy
                       </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900">{user.performanceScore}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Points</p>
                  </div>
                </div>
              ))}
            </div>

            {leaderboard.length === 0 && (
                <div className="text-center py-20">
                    <Trophy size={48} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-black uppercase text-xs tracking-widest">No entries found for this category</p>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
