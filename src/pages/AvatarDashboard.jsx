import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import {
  Radio, Inbox, Calendar, DollarSign, User,
  ArrowRight, TrendingUp, CheckCircle, Zap,
  Clock, Play
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

  const { data: recentReels = [] } = useQuery({
    queryKey: ['avatar-reels', user?.email],
    queryFn: () => base44.entities.Reel.filter({ avatar_email: user.email }, '-created_date', 3),
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
  const firstName = user?.full_name?.split(' ')[0] || 'Avatar';

  return (
    <AppShell navItems={navItems} user={user}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black mb-1">Hey, {firstName} 👋</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${profile?.is_available ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'}`} />
            <span className="text-muted-foreground">
              {profile?.is_available ? 'Available for jobs' : 'Currently offline'}
            </span>
          </div>
        </div>
        {profile && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {profile.is_available ? 'Online' : 'Offline'}
            </span>
            <Switch
              checked={profile.is_available || false}
              onCheckedChange={() => toggleAvailability.mutate()}
            />
          </div>
        )}
      </motion.div>

      {/* Go Live Hero Card */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 p-6 mb-8"
        style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(153,27,27,0.08) 100%)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-sm font-semibold text-primary">Ready to stream?</span>
            </div>
            <h2 className="text-xl font-black mb-1">Go Live Now</h2>
            <p className="text-sm text-muted-foreground">
              Start a session and connect with clients worldwide.
            </p>
          </div>
          <Link to="/AvatarLive">
            <Button size="lg" className="bg-primary hover:bg-primary/90 glow-primary font-bold shrink-0">
              <Zap className="w-5 h-5 mr-2" /> Go Live
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Pending', value: pendingBookings.length, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', path: '/AvatarRequests' },
          { label: 'Upcoming', value: upcomingBookings.length, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10', path: '/AvatarRequests' },
          { label: 'Completed', value: completedCount, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', path: '/AvatarRequests' },
          { label: 'Earnings', value: `$${profile?.total_earnings || 0}`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', path: '/AvatarEarnings' },
        ].map((stat, i) => (
          <Link key={stat.label} to={stat.path}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass border border-white/5 hover:border-primary/20 rounded-2xl p-5 transition-all hover:scale-[1.02]"
            >
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* No profile prompt */}
      {!profile && (
        <div className="glass border border-yellow-500/20 bg-yellow-500/5 rounded-2xl p-6 mb-8">
          <p className="text-sm font-bold mb-1">Complete your profile to start accepting jobs</p>
          <p className="text-xs text-muted-foreground mb-3">Add your bio, services, and pricing to appear in search results.</p>
          <Link to="/AvatarProfileEdit">
            <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-400">Set up profile →</Button>
          </Link>
        </div>
      )}

      {/* Recording Library shortcut — compact */}
      <div className="mb-8 flex items-center justify-between glass border border-white/5 rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <Play className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Recordings &amp; Reels</span>
        </div>
        <Link to="/RecordingLibrary" className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
          Open Library <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Pending Requests */}
      {pendingBookings.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">Pending Requests</h2>
            <Link to="/AvatarRequests" className="text-sm text-primary hover:underline flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {pendingBookings.slice(0, 3).map(b => (
              <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
                <div className="glass border border-white/5 hover:border-primary/30 rounded-2xl p-4 flex items-center justify-between transition-all">
                  <div>
                    <p className="font-semibold text-sm">{b.category}</p>
                    <p className="text-xs text-muted-foreground mt-1">{b.client_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">${b.total_amount || b.amount || 0}</span>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Jobs */}
      {upcomingBookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">Upcoming Jobs</h2>
            <Link to="/AvatarRequests" className="text-sm text-primary hover:underline flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingBookings.slice(0, 3).map(b => (
              <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
                <div className="glass border border-white/5 hover:border-primary/30 rounded-2xl p-4 flex items-center justify-between transition-all">
                  <div>
                    <p className="font-semibold text-sm">{b.category}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {b.client_name} · {b.scheduled_date || 'TBD'}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}