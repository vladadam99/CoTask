import React from 'react';
import { cn } from '@/lib/utils';

export default function GlassCard({ children, className = '', hover = false, onClick }) {
  return (
    <div
      className={cn('surface-panel rounded-lg', hover && 'glass-hover cursor-pointer', className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
