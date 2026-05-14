import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_HOURS = DAYS.map(day => ({
  day,
  enabled: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day),
  from: '09:00',
  to: '17:00',
}));

export default function OfficeHoursManager({ value, onChange }) {
  const [slots, setSlots] = useState(() => (value && value.length > 0) ? value : DEFAULT_HOURS);

  // Sync when editing a different offering (value identity changes)
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      const incoming = (value && value.length > 0) ? value : DEFAULT_HOURS;
      setSlots(incoming);
    }
  });

  const update = (idx, patch) => {
    const next = slots.map((s, i) => i === idx ? { ...s, ...patch } : s);
    setSlots(next);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Expert Office Hours</p>
        <span className="text-xs text-muted-foreground">(when you're available for consultations)</span>
      </div>
      {slots.map((slot, idx) => (
        <div key={slot.day} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${slot.enabled ? 'bg-card/50 border-white/10' : 'bg-muted/10 border-white/5 opacity-60'}`}>
          <button
            type="button"
            onClick={() => update(idx, { enabled: !slot.enabled })}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${slot.enabled ? 'bg-primary border-primary' : 'border-white/20'}`}
          >
            {slot.enabled && <span className="text-white text-[9px] font-black">✓</span>}
          </button>
          <span className="text-sm font-medium w-24 flex-shrink-0">{slot.day}</span>
          {slot.enabled ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="time"
                value={slot.from}
                onChange={e => update(idx, { from: e.target.value })}
                className="bg-transparent border-white/10 text-sm h-8 w-28"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="time"
                value={slot.to}
                onChange={e => update(idx, { to: e.target.value })}
                className="bg-transparent border-white/10 text-sm h-8 w-28"
              />
            </div>
          ) : (
            <span className="text-xs text-muted-foreground flex-1">Unavailable</span>
          )}
        </div>
      ))}
    </div>
  );
}