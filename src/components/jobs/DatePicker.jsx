import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isBefore, isAfter, isSameDay, isSameMonth, addDays } from 'date-fns';

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const FLEX_OPTIONS = [
  { label: 'Exact dates', value: 0 },
  { label: '± 1 day', value: 1 },
  { label: '± 2 days', value: 2 },
  { label: '± 3 days', value: 3 },
  { label: '± 7 days', value: 7 },
];

function getCalendarDays(month) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = [];
  let cur = start;
  while (!isAfter(cur, end)) {
    days.push(cur);
    cur = addDays(cur, 1);
  }
  return days;
}

export default function DatePicker({ mode, onModeChange, startDate, endDate, onStartDate, onEndDate, flexibility, onFlexibility }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(startOfMonth(today));
  const [selectingEnd, setSelectingEnd] = useState(false);

  const calDays = getCalendarDays(viewMonth);

  const handleDayClick = (day) => {
    if (isBefore(day, today) && !isSameDay(day, today)) return;

    if (mode === 'dates') {
      if (!startDate || selectingEnd) {
        if (startDate && isBefore(day, startDate)) {
          onStartDate(day);
          onEndDate(null);
          setSelectingEnd(false);
        } else if (startDate && isSameDay(day, startDate)) {
          onEndDate(null);
          setSelectingEnd(false);
        } else if (startDate) {
          onEndDate(day);
          setSelectingEnd(false);
        } else {
          onStartDate(day);
          setSelectingEnd(true);
        }
      } else {
        onStartDate(day);
        onEndDate(null);
        setSelectingEnd(true);
      }
    } else {
      // flexible: just pick one day
      onStartDate(day);
      onEndDate(null);
    }
  };

  const isInRange = (day) => {
    if (!startDate || !endDate) return false;
    return isAfter(day, startDate) && isBefore(day, endDate);
  };

  const isStart = (day) => startDate && isSameDay(day, startDate);
  const isEnd = (day) => endDate && isSameDay(day, endDate);
  const isPast = (day) => isBefore(day, today) && !isSameDay(day, today);

  return (
    <div className="space-y-4">


      {/* Calendar */}
      <div>
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={() => setViewMonth(m => subMonths(m, 1))}
            disabled={isBefore(endOfMonth(viewMonth), today)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-sm">{format(viewMonth, 'MMMM yyyy')}</span>
          <button type="button" onClick={() => setViewMonth(m => addMonths(m, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {calDays.map((day, i) => {
            const inMonth = isSameMonth(day, viewMonth);
            const past = isPast(day);
            const start = isStart(day);
            const end = isEnd(day);
            const inRange = isInRange(day);
            const isToday = isSameDay(day, today);

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleDayClick(day)}
                disabled={past || !inMonth}
                className={`
                  relative h-10 w-full flex items-center justify-center text-sm transition-all
                  ${!inMonth ? 'opacity-0 pointer-events-none' : ''}
                  ${past ? 'opacity-25 cursor-not-allowed line-through' : 'cursor-pointer'}
                  ${inRange ? 'bg-primary/15' : ''}
                  ${start ? 'rounded-l-full' : ''}
                  ${end ? 'rounded-r-full' : ''}
                  ${!start && !end && inRange ? 'rounded-none' : ''}
                `}
              >
                <span className={`
                  w-9 h-9 flex items-center justify-center rounded-full font-medium z-10 transition-all
                  ${start || end ? 'bg-foreground text-background' : ''}
                  ${isToday && !start && !end ? 'border border-foreground/40' : ''}
                  ${!start && !end && !past && inMonth ? 'hover:bg-white/10' : ''}
                `}>
                  {format(day, 'd')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Flexibility pills — shown for both modes */}
      <div className="flex flex-wrap gap-2 pt-1">
        {FLEX_OPTIONS.map(opt => (
          <button key={opt.value} type="button" onClick={() => onFlexibility(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              flexibility === opt.value
                ? 'bg-foreground text-background border-foreground'
                : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Selected summary */}
      {startDate && (
        <p className="text-xs text-muted-foreground text-center">
          {endDate
            ? `${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d, yyyy')}`
            : format(startDate, 'MMMM d, yyyy')}
          {flexibility > 0 ? ` (±${flexibility} day${flexibility > 1 ? 's' : ''})` : ''}
        </p>
      )}
    </div>
  );
}