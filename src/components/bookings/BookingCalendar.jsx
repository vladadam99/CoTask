import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';

export default function BookingCalendar({ bookings }) {
  const [month, setMonth] = useState(new Date());

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const startDow = startOfMonth(month).getDay(); // 0=Sun

  const bookingsOnDay = (day) =>
    bookings.filter(b => b.scheduled_date && isSameDay(new Date(b.scheduled_date), day));

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonth(m => subMonths(m, 1))} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-semibold">{format(month, 'MMMM yyyy')}</h3>
        <button onClick={() => setMonth(m => addMonths(m, 1))} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDow }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const dayBookings = bookingsOnDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()}
              className={`min-h-[60px] rounded-lg p-1 text-xs transition-colors ${
                isToday ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/30'
              }`}>
              <span className={`block text-center mb-1 w-6 h-6 mx-auto rounded-full flex items-center justify-center font-medium ${
                isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
              }`}>{format(day, 'd')}</span>
              {dayBookings.slice(0, 2).map(b => (
                <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
                  <div className="truncate rounded px-1 py-0.5 mb-0.5 bg-primary/20 text-primary text-[10px] hover:bg-primary/30 transition-colors">
                    {b.category}
                  </div>
                </Link>
              ))}
              {dayBookings.length > 2 && (
                <div className="text-[10px] text-muted-foreground text-center">+{dayBookings.length - 2}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bookings this month */}
      <div className="mt-4 space-y-2">
        {bookings
          .filter(b => b.scheduled_date && isSameMonth(new Date(b.scheduled_date), month))
          .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
          .map(b => (
            <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
              <GlassCard className="p-3 flex items-center gap-3" hover>
                <div className="text-center min-w-[40px]">
                  <p className="text-xs text-muted-foreground">{format(new Date(b.scheduled_date), 'MMM')}</p>
                  <p className="text-lg font-bold leading-none">{format(new Date(b.scheduled_date), 'd')}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{b.category}</p>
                  <p className="text-xs text-muted-foreground">{b.avatar_name || b.client_name} {b.scheduled_time ? `· ${b.scheduled_time}` : ''}</p>
                </div>
                <StatusBadge status={b.status} />
              </GlassCard>
            </Link>
          ))}
        {bookings.filter(b => b.scheduled_date && isSameMonth(new Date(b.scheduled_date), month)).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No scheduled bookings this month</p>
        )}
      </div>
    </div>
  );
}