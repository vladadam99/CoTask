import React from 'react';

export default function GlassCard({ children, className = '', hover = false, onClick }) {
  return (
    <div
      className={`glass rounded-xl ${hover ? 'glass-hover cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}