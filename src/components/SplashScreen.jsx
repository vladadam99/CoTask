import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone?.(), 220);
    }, 850);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center bg-background"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="surface-panel flex items-center gap-4 rounded-lg px-5 py-4 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-lg font-black text-primary-foreground">
              C
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-foreground">
                Co<span className="text-primary">Task</span>
              </p>
              <p className="text-xs font-medium text-muted-foreground">Loading your workspace</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

