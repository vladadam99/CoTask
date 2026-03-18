import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import {
  Home, Inbox, Calendar, Radio, MessageSquare, DollarSign,
  Star, User, Settings, TrendingUp, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

const navItems = [
  { icon: Home, label: 'Home', path: '/AvatarDashboard' },
  { icon: Inbox, label: 'Requests', path: '/AvatarRequests' },
  { icon: Calendar, label: 'Schedule', path: '/AvatarSchedule' },
  { icon: Radio, label: 'Live', path: '/AvatarLive' },
  { icon: MessageSquare, label: 'Messages', path: '/Messages' },
  { icon: DollarSign, label: 'Earnings', path: '/AvatarEarnings' },
  { icon: Star, label: 'Reviews', path: '/AvatarReviews' },
  { icon: User, label: 'Profile', path: '/AvatarProfileEdit' },
  { icon: Settings, label: 'Settings', path: '/AvatarSettings' },
];

export default function AvatarEarnings() {
  const { user, loading } = useCurrentUser();

  const { data: profile } = useQuery({
    queryKey: ['avatar-profile-earnings', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.AvatarProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['avatar-earnings-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ avatar_email: user.email, status: 'completed' }, '-created_date', 50),
    enabled: !!user,
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const totalEarnings = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const thisMonthBookings = bookings.filter(b => {
    const d = new Date(b.created_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthEarnings = thisMonthBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <AppShell navItems={navItems} user={user}>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1">Earnings</h1>
        <p className="text-muted-foreground text-sm">Track your income and completed sessions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Earnings', value: `$${totalEarnings.toFixed(2)}`, icon: DollarSign, color: 'text-primary' },
          { label: 'This Month', value: `$${thisMonthEarnings.toFixed(2)}`, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Completed Jobs', value: bookings.length, icon: Star, color: 'text-yellow-400' },
          { label: 'Avg Per Job', value: bookings.length ? `$${(totalEarnings / bookings.length).toFixed(0)}` : '$0', icon: ArrowRight, color: 'text-blue-400' },
        ].map(stat => (
          <GlassCard key={stat.label} className="p-5">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Payout status */}
      {profile && (
        <GlassCard className="p-5 mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm mb-1">Payout Account</p>
            <p className="text-xs text-muted-foreground">
              {profile.payout_status === 'active' ? 'Connected and active' : profile.payout_status === 'pending' ? 'Setup in progress' : 'Not connected — set up payouts to receive funds'}
            </p>
          </div>
          <StatusBadge status={profile.payout_status || 'not_connected'} />
        </GlassCard>
      )}

      {/* Transaction history */}
      <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
      {bookings.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No completed bookings yet</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {bookings.map(b => (
            <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
              <GlassCard className="p-4 flex items-center justify-between gap-4" hover>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.category} — {b.client_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.created_date ? format(new Date(b.created_date), 'MMM d, yyyy') : ''}</p>
                </div>
                <span className="text-green-400 font-semibold text-sm">+${b.amount || 0}</span>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}