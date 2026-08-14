import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const UserCard = ({ user }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={() => navigate("/profile")}
      className="bg-white rounded-2xl p-6 cursor-pointer shadow-md border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all"
    >
      <div className="flex items-center gap-4">
        {/* Profile Picture */}
        <div className="w-20 h-20 rounded-full border-2 border-slate-200 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 shadow-md">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-[#1421AC]">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 truncate">
            {user?.name}
          </h3>
          <p className="text-sm text-slate-500 truncate">{user?.email}</p>
          <div className="flex gap-3 mt-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-[#1421AC]">
              📚 {user?.language}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700">
              ⭐ {user?.performanceScore}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight className="w-5 h-5 flex-shrink-0 text-slate-400" />
      </div>
    </motion.div>
  );
};

export default UserCard;
