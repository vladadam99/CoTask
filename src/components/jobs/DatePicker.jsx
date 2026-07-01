import React, { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isBefore, isAfter, isSameDay, isSameMonth, addDays } from 'date-fns';

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const FLEX_OPTIONS = [
  { label: 'Exact', value: 0 },
  { label: '+/- 1 day', value: 1 },
  { label: '+/- 2 days', value: 2 },
  { label: '+/- 3 days', value: 3 },
  { label: '+/- 7 days', value: 7 },
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

function getNextWeekend(today) {
  const day = today.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  return addDays(today, daysUntilSaturday);
}

export default function DatePicker({ mode, onModeChange, startDate, endDate, onStartDate, onEndDate, flexibility, onFlexibility }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(startOfMonth(startDate || today));
  const [selectingEnd, setSelectingEnd] = useState(false);
  const calDays = getCalendarDays(viewMonth);

  const selectDay = (day) => {
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
      onStartDate(day);
      onEndDate(null);
      setSelectingEnd(false);
    }
  };

  const pickQuickDate = (day) => {
    onModeChange('flexible');
    onStartDate(day);
    onEndDate(null);
    setSelectingEnd(false);
    setViewMonth(startOfMonth(day));
  };

  const isInRange = (day) => {
    if (!startDate || !endDate) return false;
    return isAfter(day, startDate) && isBefore(day, endDate);
  };

  const summary = startDate
    ? endDate
      ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
      : format(startDate, 'EEEE, MMM d')
    : 'Choose a date';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'dates', title: 'Set date', hint: 'Single day or range' },
          { key: 'flexible', title: 'Flexible', hint: 'Best available day' },
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onModeChange(option.key)}
            className={`rounded-lg border p-3 text-left transition-all ${
              mode === option.key
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
            }`}
          >
            <span className="block text-sm font-semibold">{option.title}</span>
            <span className="block text-xs mt-0.5">{option.hint}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Today', value: today },
          { label: 'Tomorrow', value: addDays(today, 1) },
          { label: 'Weekend', value: getNextWeekend(today) },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => pickQuickDate(option.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between pb-3">
          <button
            type="button"
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
            disabled={isBefore(endOfMonth(viewMonth), today)}
            className="h-9 w-9 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-sm font-bold">
            <CalendarDays className="w-4 h-4 text-primary" />
            {format(viewMonth, 'MMMM yyyy')}
          </div>
          <button
            type="button"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="h-9 w-9 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 pb-1">
          {DAYS.map((day) => (
            <div key={day} className="py-1 text-center text-[11px] font-bold text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calDays.map((day, i) => {
            const inMonth = isSameMonth(day, viewMonth);
            const past = isBefore(day, today) && !isSameDay(day, today);
            const start = startDate && isSameDay(day, startDate);
            const end = endDate && isSameDay(day, endDate);
            const inRange = isInRange(day);
            const isToday = isSameDay(day, today);

            return (
              <button
                key={i}
                type="button"
                onClick={() => selectDay(day)}
                disabled={past || !inMonth}
                className={`relative h-10 rounded-lg text-sm font-semibold transition-all ${
                  !inMonth ? 'pointer-events-none opacity-0' : ''
                } ${past ? 'cursor-not-allowed text-muted-foreground/35' : 'text-foreground hover:bg-secondary'} ${
                  inRange ? 'bg-primary/10 text-primary' : ''
                } ${start || end ? 'bg-primary text-primary-foreground hover:bg-primary' : ''} ${
                  isToday && !start && !end ? 'ring-1 ring-primary/40' : ''
                }`}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-secondary/40 p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="w-4 h-4 text-primary" />
          {summary}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {FLEX_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onFlexibility(option.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                flexibility === option.value
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
