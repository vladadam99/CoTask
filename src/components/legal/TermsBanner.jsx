import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'cotask_terms_accepted';

export default function TermsBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
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
          className="fixed bottom-20 left-4 right-4 z-[100] mx-auto max-w-xl lg:bottom-4 lg:left-auto lg:right-6 lg:mx-0"
        >
          <div className="surface-panel flex items-start gap-4 rounded-lg px-5 py-4 shadow-2xl">
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-sm font-medium text-foreground">We use essential cookies</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                By using CoTask, you agree to our{' '}
                <Link to="/Terms" className="text-primary hover:underline" onClick={accept}>
                  Terms & Conditions
                </Link>
                {' '}and essential platform cookies.
              </p>
            </div>
            <div className="mt-0.5 flex shrink-0 items-center gap-2">
              <button
                onClick={accept}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Got it
              </button>
              <button
                onClick={accept}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary/60"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
