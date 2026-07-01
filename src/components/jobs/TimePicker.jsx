import React from 'react';
import { Clock, RefreshCw, TimerReset } from 'lucide-react';

const REPEAT_OPTIONS = [
  { label: 'Once', value: null },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Every 2 weeks', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
];
const DURATION_PRESETS = ['1', '2', '3', '4'];

export default function TimePicker({ timeMode, onTimeMode, startTime, onStartTime, endTime, onEndTime, repeat, onRepeat }) {
  const repeatLabel = REPEAT_OPTIONS.find((option) => option.value === repeat)?.label || 'Once';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'range', title: 'Exact time', hint: 'Set a start and end' },
          { key: 'flexible', title: 'Flexible time', hint: 'Set expected hours' },
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onTimeMode(option.key)}
            className={`rounded-lg border p-3 text-left transition-all ${
              timeMode === option.key
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
            }`}
          >
            <span className="block text-sm font-semibold">{option.title}</span>
            <span className="block text-xs mt-0.5">{option.hint}</span>
          </button>
        ))}
      </div>

      {timeMode === 'range' ? (
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Starts</span>
              <div className="relative mt-1.5">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="time"
                  value={startTime || ''}
                  onChange={(e) => onStartTime(e.target.value)}
                  className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/45"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">Ends</span>
              <div className="relative mt-1.5">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="time"
                  value={endTime || ''}
                  onChange={(e) => onEndTime(e.target.value)}
                  className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/45"
                />
              </div>
            </label>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Expected duration</span>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="relative flex-1">
                <TimerReset className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="number"
                  min="1"
                  placeholder="2"
                  value={endTime || ''}
                  onChange={(e) => onEndTime(e.target.value)}
                  className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-14 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/45"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">hrs</span>
              </div>
            </div>
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {DURATION_PRESETS.map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => onEndTime(hours)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  endTime === hours
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {hours}h
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-secondary/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <RefreshCw className="w-4 h-4 text-primary" />
            Repeat
          </div>
          <span className="text-xs font-semibold text-muted-foreground">{repeatLabel}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {REPEAT_OPTIONS.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onRepeat(option.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                repeat === option.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
