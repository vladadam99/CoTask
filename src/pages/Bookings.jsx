import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import AppShell from '@/components/layout/AppShell';
import { Calendar, Search, LayoutGrid, CalendarDays } from 'lucide-react';
import BookingCalendar from '@/components/bookings/BookingCalendar';
import { Input } from '@/components/ui/input';
import { getNavItems } from '@/lib/navItems';

const TABS = ['All', 'Pending', 'Active', 'Completed', 'Cancelled'];

export default function Bookings() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

  const isAvatar = user?.role === 'avatar';

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['all-bookings', user?.email, isAvatar],
    queryFn: () => {
      const filter = isAvatar ? { avatar_email: user.email } : { client_email: user.email };
      return base44.entities.Booking.filter(filter, '-created_date', 50);
    },
    enabled: !!user,
  });

  const filtered = bookings.filter(b => {
    const matchTab = tab === 'All' ||
      (tab === 'Pending' && b.status === 'pending') ||
      (tab === 'Active' && ['accepted', 'scheduled', 'in_progress', 'live'].includes(b.status)) ||
      (tab === 'Completed' && b.status === 'completed') ||
      (tab === 'Cancelled' && ['cancelled', 'declined'].includes(b.status));
    const matchSearch = !search || b.category?.toLowerCase().includes(search.toLowerCase()) ||
      (isAvatar ? b.client_name : b.avatar_name)?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
            <LayoutGrid className="w-4 h-4" /> List
          </button>
          <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${viewMode === 'calendar' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
            <CalendarDays className="w-4 h-4" /> Calendar
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings..." className="pl-10 bg-muted/50 border-white/5" />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
              t === tab ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}>{t}</button>
        ))}
      </div>

      {viewMode === 'calendar' ? (
        <BookingCalendar bookings={bookings} />
      ) : isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="glass rounded-xl p-5 animate-pulse"><div className="h-4 bg-muted rounded w-1/2 mb-2" /><div className="h-3 bg-muted rounded w-1/3" /></div>)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(b => (
            <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
              <GlassCard className="p-5" hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{b.category}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isAvatar ? b.client_name : b.avatar_name} · {b.scheduled_date || 'Immediate'} {b.scheduled_time || ''}
                    </p>
                    {b.location && <p className="text-xs text-muted-foreground mt-1">{b.location}</p>}
                  </div>
                  <div className="text-right">
                    <StatusBadge status={b.status} />
                    <p className="text-sm font-medium mt-2">${b.total_amount || 0}</p>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      ) : (
        <GlassCard className="p-10 text-center">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No bookings match your filter</p>
        </GlassCard>
      )}
    </AppShell>
  );
}