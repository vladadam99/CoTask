import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import GlobeMap from '@/components/explore/GlobeMap';
import {
  Home, Inbox, Calendar, Radio, MessageSquare, DollarSign, Star, User, Settings,
  ArrowRight, TrendingUp, Clock, CheckCircle, MapPin, Search, Map, LayoutGrid
} from 'lucide-react';

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

export default function AvatarDashboard() {
  const { user, loading: userLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const [globeView, setGlobeView] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [focusCity, setFocusCity] = useState('');

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

  // Load nearby avatar profiles to show on globe (other avatars in similar locations)
  const { data: allAvatars = [] } = useQuery({
    queryKey: ['globe-avatars'],
    queryFn: () => base44.entities.AvatarProfile.filter({ status: 'active' }, '-rating', 50),
  });

  const toggleAvailability = useMutation({
    mutationFn: () => base44.entities.AvatarProfile.update(profile.id, { is_available: !profile.is_available }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['avatar-profile'] }),
  });

  if (userLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const todayBookings = bookings.filter(b => b.status === 'accepted' || b.status === 'scheduled');
  const completedCount = bookings.filter(b => b.status === 'completed').length;

  return (
    <AppShell navItems={navItems} user={user}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">Avatar Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {user?.full_name?.split(' ')[0] || 'Avatar'}</p>
        </div>
        {profile && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{profile.is_available ? 'Available' : 'Offline'}</span>
            <Switch checked={profile.is_available || false} onCheckedChange={() => toggleAvailability.mutate()} />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Pending Requests', value: pendingBookings.length, icon: Inbox, color: 'text-yellow-400' },
          { label: 'Upcoming', value: todayBookings.length, icon: Calendar, color: 'text-blue-400' },
          { label: 'Completed', value: completedCount, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Earnings', value: `$${profile?.total_earnings || 0}`, icon: TrendingUp, color: 'text-primary' },
        ].map(stat => (
          <GlassCard key={stat.label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <Link to="/AvatarLive">
          <GlassCard className="p-4 text-center border-primary/20" hover>
            <Radio className="w-5 h-5 text-primary mx-auto mb-2" />
            <span className="text-sm font-medium">Start Live Session</span>
          </GlassCard>
        </Link>
        <Link to="/AvatarRequests">
          <GlassCard className="p-4 text-center" hover>
            <Inbox className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
            <span className="text-sm font-medium">View Requests</span>
          </GlassCard>
        </Link>
        <Link to="/Messages">
          <GlassCard className="p-4 text-center" hover>
            <MessageSquare className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <span className="text-sm font-medium">Messages</span>
          </GlassCard>
        </Link>
      </div>

      {/* Pending Requests */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pending Requests</h2>
          <Link to="/AvatarRequests" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {pendingBookings.length > 0 ? (
          <div className="space-y-3">
            {pendingBookings.map(b => (
              <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
                <GlassCard className="p-4 flex items-center justify-between" hover>
                  <div>
                    <p className="font-medium text-sm">{b.category}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {b.client_name} · {b.scheduled_date || 'ASAP'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-primary">${b.total_amount || b.amount}</span>
                    <StatusBadge status={b.status} />
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        ) : (
          <GlassCard className="p-8 text-center">
            <Inbox className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No pending requests right now</p>
            <p className="text-xs text-muted-foreground mt-1">Make sure you're set to available to receive bookings</p>
          </GlassCard>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {bookings.length > 0 ? (
          <div className="space-y-2">
            {bookings.slice(0, 5).map(b => (
              <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
                <GlassCard className="p-3 flex items-center justify-between" hover>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{b.category} — {b.client_name}</p>
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </GlassCard>
              </Link>
            ))}
          </div>
        ) : (
          <GlassCard className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No activity yet. Your bookings will appear here.</p>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}