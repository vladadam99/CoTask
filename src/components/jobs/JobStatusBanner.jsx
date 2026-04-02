import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Car, MapPin, Hammer, Flag, Clock } from 'lucide-react';

const STATUS_CONFIG = {
  on_the_way:  { label: 'On The Way',  icon: Car,    color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',   emoji: '🚗' },
  arrived:     { label: 'Arrived',     icon: MapPin,  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',  emoji: '📍' },
  working:     { label: 'Working',     icon: Hammer,  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', emoji: '🔨' },
  wrapping_up: { label: 'Wrapping Up', icon: Flag,    color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', emoji: '🏁' },
};

function useElapsed(startIso) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!startIso) return;
    const calc = () => {
      const secs = Math.floor((Date.now() - new Date(startIso)) / 1000);
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      setElapsed(h > 0
        ? `${h}h ${String(m).padStart(2,'0')}m`
        : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      );
    };
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [startIso]);
  return elapsed;
}

export default function JobStatusBanner({ job, onJobUpdated }) {
  const elapsed = useElapsed(job?.started_at);

  useEffect(() => {
    if (!job?.id) return;
    const unsub = base44.entities.JobPost.subscribe((event) => {
      if (event.id === job.id || event.data?.id === job.id) {
        onJobUpdated?.();
      }
    });
    return unsub;
  }, [job?.id]);

  if (!job || job.status !== 'in_progress' || !job.started_at) return null;

  const cfg = job.arrival_status ? STATUS_CONFIG[job.arrival_status] : null;
  const Icon = cfg?.icon;

  return (
    <div className={`mx-4 my-2 rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 ${cfg ? cfg.bg : 'bg-green-500/10 border-green-500/20'}`}>
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
        <div>
          <p className={`text-sm font-semibold ${cfg ? cfg.color : 'text-green-400'}`}>
            {cfg ? `${cfg.emoji} Avatar is ${cfg.label}` : '🟢 Job is in progress'}
          </p>
          {job.arrival_status_updated_at && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Updated {new Date(job.arrival_status_updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>
      {elapsed && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
          <Clock className="w-3 h-3" />
          <span className="tabular-nums">{elapsed}</span>
        </div>
      )}
    </div>
  );
}