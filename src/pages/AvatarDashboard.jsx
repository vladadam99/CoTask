import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Radio, Inbox, Calendar, DollarSign, User, Settings,
  ArrowRight, TrendingUp, CheckCircle, Zap
} from 'lucide-react';

const navItems = [
  { icon: Zap, label: 'Go Live', path: '/AvatarLive' },
  { icon: Inbox, label: 'Bookings', path: '/AvatarRequests' },
  { icon: DollarSign, label: 'Earnings', path: '/AvatarEarnings' },
  { icon: User, label: 'Setup', path: '/AvatarProfileEdit' },
];

export default function AvatarDashboard() {
  const { user, loading: userLoading } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['avatar-profile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.AvatarProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['avatar-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ avatar_email: user.email }, '-created_date', 10),
    enabled: !!user,
  });

  const toggleAvailability = useMutation({
    mutationFn: () => base44.entities.AvatarProfile.update(profile.id, { is_available: !profile.is_available }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['avatar-profile'] }),
  });

  if (userLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const upcomingBookings = bookings.filter(b => ['accepted', 'scheduled'].includes(b.status));
  const completedCount = bookings.filter(b => b.status === 'completed').length;

  return (
    <AppShell navItems={navItems} user={user}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">
            Hey, {user?.full_name?.split(' ')[0] || 'Avatar'} 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            {profile?.is_available ? '🟢 You\'re available for jobs' : '⚫ You\'re currently offline'}
          </p>
        </div>
        {profile && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {profile.is_available ? 'Available' : 'Offline'}
            </span>
            <Switch
              checked={profile.is_available || false}
              onCheckedChange={() => toggleAvailability.mutate()}
            />
          </div>
        )}
      </div>

      {/* Primary CTA */}
      <GlassCard className="p-6 mb-8 border border-primary/20 glow-primary">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" /> Ready to go live?
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Start a live stream session and connect with clients in real time.
            </p>
          </div>
          <Link to="/AvatarLive">
            <Button size="lg" className="bg-primary hover:bg-primary/90 glow-primary-sm shrink-0">
              <Zap className="w-5 h-5 mr-2" /> Go Live
            </Button>
          </Link>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Pending', value: pendingBookings.length, icon: Inbox, color: 'text-yellow-400', path: '/AvatarRequests' },
          { label: 'Upcoming', value: upcomingBookings.length, icon: Calendar, color: 'text-blue-400', path: '/AvatarRequests' },
          { label: 'Completed', value: completedCount, icon: CheckCircle, color: 'text-green-400', path: '/AvatarRequests' },
          { label: 'Earnings', value: `$${profile?.total_earnings || 0}`, icon: TrendingUp, color: 'text-primary', path: '/AvatarEarnings' },
        ].map(stat => (
          <Link key={stat.label} to={stat.path}>
            <GlassCard className="p-5" hover>
              <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* No profile setup prompt */}
      {!profile && (
        <GlassCard className="p-6 mb-8 border border-yellow-500/20 bg-yellow-500/5">
          <p className="text-sm font-medium mb-1">Complete your profile to start accepting jobs</p>
          <p className="text-xs text-muted-foreground mb-3">Add your bio, services, and pricing to appear in search results.</p>
          <Link to="/AvatarProfileEdit">
            <Button size="sm" variant="outline">Set up profile →</Button>
          </Link>
        </GlassCard>
      )}

      {/* Pending Requests */}
      {pendingBookings.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Pending Requests</h2>
            <Link to="/AvatarRequests" className="text-sm text-primary hover:underline flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {pendingBookings.slice(0, 3).map(b => (
              <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
                <GlassCard className="p-4 flex items-center justify-between" hover>
                  <div>
                    <p className="font-medium text-sm">{b.category}</p>
                    <p className="text-xs text-muted-foreground mt-1">{b.client_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-primary">${b.total_amount || b.amount || 0}</span>
                    <StatusBadge status={b.status} />
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Upcoming Jobs</h2>
            <Link to="/AvatarRequests" className="text-sm text-primary hover:underline flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingBookings.slice(0, 3).map(b => (
              <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
                <GlassCard className="p-4 flex items-center justify-between" hover>
                  <div>
                    <p className="font-medium text-sm">{b.category}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {b.client_name} · {b.scheduled_date || 'TBD'}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}