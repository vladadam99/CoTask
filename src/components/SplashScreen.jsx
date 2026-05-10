import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 600);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-background flex items-center justify-center overflow-hidden"
        >
          {/* Background floating shapes */}
          <motion.div
            className="absolute w-72 h-72 rounded-full bg-primary/10"
            style={{ top: '-5%', left: '-10%' }}
            animate={{ scale: [1, 1.15, 1], rotate: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-48 h-48 rounded-full bg-primary/20"
            style={{ bottom: '5%', right: '-8%' }}
            animate={{ scale: [1, 1.2, 1], rotate: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
          <motion.div
            className="absolute w-32 h-32 rounded-2xl bg-primary/15"
            style={{ top: '15%', right: '10%' }}
            animate={{ rotate: [0, 45, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
          <motion.div
            className="absolute w-20 h-20 rounded-full bg-primary/25"
            style={{ bottom: '20%', left: '8%' }}
            animate={{ y: [-10, 10, -10], scale: [1, 1.15, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          />
          <motion.div
            className="absolute w-14 h-14 rounded-xl bg-primary/30"
            style={{ top: '40%', left: '5%' }}
            animate={{ rotate: [0, -30, 0], y: [-8, 8, -8] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          />
          <motion.div
            className="absolute w-10 h-10 rounded-full bg-primary/20"
            style={{ top: '60%', right: '12%' }}
            animate={{ scale: [1, 1.3, 1], x: [-5, 5, -5] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />

          {/* Logo */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <motion.div
              className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center glow-primary"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <span className="text-2xl font-black text-white">C</span>
            </motion.div>
            <motion.p
              className="text-2xl font-black tracking-tight"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              Co<span className="text-primary">Task</span>
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}