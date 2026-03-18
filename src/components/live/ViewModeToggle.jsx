import React from 'react';
import { Eye, RotateCcw, Globe } from 'lucide-react';

const MODES = [
  { id: 'fpv', label: 'FPV', sublabel: 'First Person', icon: Eye },
  { id: 'tps', label: 'TPS', sublabel: 'Third Person', icon: Globe },
  { id: '360', label: '360°', sublabel: 'Sphere View', icon: RotateCcw },
];

export default function ViewModeToggle({ mode, onChange, available = ['fpv', 'tps'] }) {
  return (
    <div className="flex gap-2">
      {MODES.map(m => {
        const isAvail = available.includes(m.id);
        const isActive = mode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => isAvail && onChange(m.id)}
            disabled={!isAvail}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border
              ${!isAvail ? 'opacity-30 cursor-not-allowed border-white/5 text-muted-foreground' :
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card/50 border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20'
              }`}
          >
            <m.icon className="w-3.5 h-3.5" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}