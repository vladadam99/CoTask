import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function JobCountdown({ scheduledDate }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const target = new Date(scheduledDate).getTime();

    const calc = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ started: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds, started: false });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [scheduledDate]);

  if (!timeLeft) return null;

  if (timeLeft.started) {
    return (
      <div className="glass rounded-2xl p-4 border border-green-500/30 text-center">
        <div className="text-green-400 font-bold text-lg">🚀 Job is starting now!</div>
        <p className="text-sm text-muted-foreground mt-1">Check your chat to coordinate with your client.</p>
      </div>
    );
  }

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds },
  ];

  return (
    <div className="glass rounded-2xl p-5 border border-primary/20 space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Job starts in</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {units.map(u => (
          <div key={u.label} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
            <div className="text-2xl font-bold tabular-nums">{String(u.value).padStart(2, '0')}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}