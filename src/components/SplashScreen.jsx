import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const shapes = [
  { size: 320, x: '-15%', y: '-20%', delay: 0, duration: 6, type: 'circle', opacity: 0.35 },
  { size: 200, x: '70%', y: '-10%', delay: 0.2, duration: 5, type: 'circle', opacity: 0.45 },
  { size: 150, x: '80%', y: '60%', delay: 0.4, duration: 4.5, type: 'square', opacity: 0.4 },
  { size: 100, x: '10%', y: '70%', delay: 0.1, duration: 5.5, type: 'circle', opacity: 0.5 },
  { size: 60,  x: '50%', y: '80%', delay: 0.6, duration: 4, type: 'square', opacity: 0.55 },
  { size: 80,  x: '35%', y: '-5%', delay: 0.3, duration: 3.5, type: 'circle', opacity: 0.4 },
  { size: 40,  x: '88%', y: '25%', delay: 0.7, duration: 3, type: 'circle', opacity: 0.6 },
  { size: 250, x: '30%', y: '40%', delay: 0.5, duration: 7, type: 'ring', opacity: 0.25 },
  { size: 180, x: '-5%', y: '35%', delay: 0.2, duration: 5.5, type: 'ring', opacity: 0.3 },
  { size: 120, x: '60%', y: '10%', delay: 0.8, duration: 4, type: 'square', opacity: 0.35 },
  { size: 50,  x: '20%', y: '15%', delay: 0.9, duration: 3.2, type: 'circle', opacity: 0.6 },
  { size: 70,  x: '75%', y: '78%', delay: 0.4, duration: 4.8, type: 'square', opacity: 0.45 },
];

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 700);
    }, 2600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: 'hsl(220 20% 7%)' }}
        >
          {/* Radial glow behind logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              className="w-96 h-96 rounded-full"
              style={{ background: 'radial-gradient(circle, hsl(355 80% 48% / 0.4) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Shapes */}
          {shapes.map((s, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: s.x, top: s.y }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: s.opacity, scale: 1 }}
              transition={{ delay: s.delay * 0.4, duration: 0.6, ease: 'easeOut' }}
            >
              <motion.div
                style={{
                  width: s.size,
                  height: s.size,
                  borderRadius: s.type === 'circle' ? '50%' : s.type === 'square' ? '20%' : '50%',
                  background: s.type === 'ring'
                    ? 'transparent'
                    : `hsl(355 80% 48% / ${s.opacity})`,
                  border: s.type === 'ring'
                    ? `3px solid hsl(355 80% 60% / ${s.opacity + 0.2})`
                    : 'none',
                  boxShadow: s.type !== 'ring'
                    ? `0 0 ${s.size * 0.4}px hsl(355 80% 48% / 0.4)`
                    : 'none',
                }}
                animate={
                  s.type === 'square'
                    ? { rotate: [0, 60, 0], scale: [1, 1.12, 1] }
                    : s.type === 'ring'
                    ? { rotate: [0, 360], scale: [1, 1.08, 1] }
                    : { y: [-12, 12, -12], scale: [1, 1.1, 1] }
                }
                transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
              />
            </motion.div>
          ))}

          {/* Particle dots */}
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.div
              key={`dot-${i}`}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 6 + 3,
                height: Math.random() * 6 + 3,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `hsl(355 80% ${55 + Math.random() * 20}%)`,
                boxShadow: `0 0 8px hsl(355 80% 55%)`,
              }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.5, 1] }}
              transition={{ duration: 1.5 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 1.5 }}
            />
          ))}

          {/* Logo */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          >
            <motion.div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'hsl(355 80% 48%)', boxShadow: '0 0 40px hsl(355 80% 48% / 0.8), 0 0 80px hsl(355 80% 48% / 0.4)' }}
              animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-3xl font-black text-white">C</span>
            </motion.div>
            <motion.p
              className="text-3xl font-black tracking-tight text-white"
              style={{ textShadow: '0 0 30px hsl(355 80% 48% / 0.8)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              Co<span style={{ color: 'hsl(355 80% 58%)' }}>Task</span>
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}