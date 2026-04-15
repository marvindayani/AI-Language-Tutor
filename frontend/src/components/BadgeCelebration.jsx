import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Award, Flame, Map, ShieldCheck, Plane, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const icons = {
  map: Map,
  fire: Flame,
  award: Award,
  star: Star,
  plane: Plane,
  'shield-check': ShieldCheck,
  crown: Trophy
};

const BadgeCelebration = ({ badges, onClose }) => {
  useEffect(() => {
    if (badges && badges.length > 0) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [badges]);

  if (!badges || badges.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full overflow-hidden relative"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X size={24} />
          </button>

          <div className="p-10 text-center">
            <motion.div
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 100, delay: 0.2 }}
              className="w-24 h-24 bg-amber-100 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-200"
            >
              <Trophy size={48} fill="currentColor" />
            </motion.div>

            <h2 className="text-3xl font-black text-slate-900 mb-2 leading-tight">Achievement Unlocked!</h2>
            <p className="text-slate-500 font-medium mb-8">You've reached a new learning milestone.</p>

            <div className="space-y-4">
              {badges.map((badge, idx) => {
                const Icon = icons[badge.icon] || Award;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-3xl text-left"
                  >
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-slate-100 shrink-0">
                      <Icon size={28} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg leading-tight">{badge.name}</h4>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">{badge.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full mt-10 bg-indigo-600 text-white rounded-2xl py-4 font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
            >
              Keep Learning
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BadgeCelebration;
