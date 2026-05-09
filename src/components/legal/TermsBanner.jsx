import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'cotask_terms_accepted';

export default function TermsBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay so it doesn't flash on first paint
    const timer = setTimeout(() => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-20 lg:bottom-4 left-4 right-4 z-[100] max-w-xl lg:left-auto lg:right-6 mx-auto lg:mx-0"
        >
          <div className="glass-strong rounded-2xl border border-white/10 px-5 py-4 flex items-start gap-4 shadow-2xl">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground font-medium mb-0.5">We use cookies & you agree to our terms</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                By using CoTask, you agree to our{' '}
                <Link to="/Terms" className="text-primary hover:underline" onClick={accept}>
                  Terms & Conditions
                </Link>
                {' '}and our use of essential cookies.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
              <button
                onClick={accept}
                className="text-xs font-semibold px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
              >
                Got it
              </button>
              <button
                onClick={accept}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}