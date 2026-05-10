import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';

const REPEAT_OPTIONS = [
  { label: 'No repeat', value: null },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Every 2 weeks', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
];

export default function TimePicker({ timeMode, onTimeMode, startTime, onStartTime, endTime, onEndTime, repeat, onRepeat }) {
  return (
    <div className="space-y-5">

      {/* Time mode toggle */}
      <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 gap-1">
        <button type="button" onClick={() => onTimeMode('range')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            timeMode === 'range' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
          }`}>
          Time range
        </button>
      </div>

      {/* Time inputs */}
      <div className="space-y-3">
        {timeMode === 'specific' ? (
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="time"
                value={startTime || ''}
                onChange={e => onStartTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">From</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="time"
                  value={startTime || ''}
                  onChange={e => onStartTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">To</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="time"
                  value={endTime || ''}
                  onChange={e => onEndTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Repeat */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          <label className="text-xs text-muted-foreground font-medium">Repeat</label>
        </div>
        <div className="flex flex-wrap gap-2">
          {REPEAT_OPTIONS.map(opt => (
            <button key={String(opt.value)} type="button" onClick={() => onRepeat(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                repeat === opt.value
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {startTime && (
        <p className="text-xs text-muted-foreground">
          {timeMode === 'range' && endTime
            ? `${startTime} – ${endTime}`
            : startTime}
          {repeat ? ` · Repeats ${REPEAT_OPTIONS.find(o => o.value === repeat)?.label?.toLowerCase()}` : ''}
        </p>
      )}
    </div>
  );
}