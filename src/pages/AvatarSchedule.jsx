import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { getNavItems } from '@/lib/navItems';
import {
  Calendar, ChevronLeft, ChevronRight, Clock, MapPin
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import AvailabilityManager from '@/components/schedule/AvailabilityManager';



export default function AvatarSchedule() {
  const { user, loading } = useCurrentUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const { data: bookings = [] } = useQuery({
    queryKey: ['avatar-schedule-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ avatar_email: user.email }, '-scheduled_date', 100),
    enabled: !!user,
  });

  const { data: avatarProfile } = useQuery({
    queryKey: ['avatar-profile-schedule', user?.email],
    queryFn: async () => {
      const list = await base44.entities.AvatarProfile.filter({ user_email: user.email });
      return list[0] || null;
    },
    enabled: !!user,
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const scheduledBookings = bookings.filter(b => ['accepted', 'scheduled', 'in_progress'].includes(b.status) && b.scheduled_date);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPad = getDay(days[0]);

  const bookingsOnDay = (day) => scheduledBookings.filter(b => {
    if (!b.scheduled_date) return false;
    return isSameDay(new Date(b.scheduled_date), day);
  });

  const selectedBookings = bookingsOnDay(selectedDay);

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1">My Schedule</h1>
        <p className="text-muted-foreground text-sm">{scheduledBookings.length} upcoming session{scheduledBookings.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <GlassCard className="p-5">
            {/* Month Nav */}
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-semibold text-base">{format(currentMonth, 'MMMM yyyy')}</h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
              {days.map(day => {
                const dayBookings = bookingsOnDay(day);
                const isSelected = isSameDay(day, selectedDay);
                const today = isToday(day);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors
                      ${isSelected ? 'bg-primary text-primary-foreground' : today ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}
                    `}
                  >
                    <span className="font-medium">{format(day, 'd')}</span>
                    {dayBookings.length > 0 && (
                      <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Selected Day */}
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
            {isToday(selectedDay) ? 'Today' : format(selectedDay, 'EEEE, MMM d')}
          </h3>
          {selectedBookings.length === 0 ? (
            <GlassCard className="p-6 text-center">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No sessions this day</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {selectedBookings.map(b => (
                <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
                  <GlassCard className="p-4" hover>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-sm">{b.category}</p>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{b.client_name}</p>
                    <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      {b.scheduled_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.scheduled_time}</span>}
                      {b.duration_minutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.duration_minutes} min</span>}
                      {b.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.location}</span>}
                    </div>
                    <p className="text-primary font-semibold text-sm mt-2">${b.total_amount || b.amount || 0}</p>
                  </GlassCard>
                </Link>
              ))}
            </div>
          )}

          {/* Upcoming this month */}
          <h3 className="font-semibold text-sm text-muted-foreground mt-6 mb-3 uppercase tracking-wide">This Month</h3>
          <div className="space-y-2">
            {scheduledBookings
              .filter(b => {
                const d = new Date(b.scheduled_date);
                return d >= startOfMonth(currentMonth) && d <= endOfMonth(currentMonth);
              })
              .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
              .slice(0, 6)
              .map(b => (
                <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
                  <GlassCard className="p-3 flex items-center gap-3" hover>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary flex-shrink-0">
                      <span className="text-xs font-bold leading-none">{format(new Date(b.scheduled_date), 'd')}</span>
                      <span className="text-[10px] leading-none">{format(new Date(b.scheduled_date), 'MMM')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{b.category} · {b.client_name}</p>
                      {b.scheduled_time && <p className="text-xs text-muted-foreground">{b.scheduled_time}</p>}
                    </div>
                    <span className="text-xs font-semibold text-primary">${b.total_amount || b.amount || 0}</span>
                  </GlassCard>
                </Link>
              ))}
          </div>
        </div>
      </div>

      {/* Availability Manager */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Set Your Availability</h2>
        <AvailabilityManager avatarProfile={avatarProfile} />
      </div>
    </AppShell>
  );
}