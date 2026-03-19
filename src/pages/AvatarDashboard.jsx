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
  ArrowRight, TrendingUp, Clock, CheckCircle, MapPin, Search, Globe
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

  // For globe: load active avatars so avatar can see where jobs are coming from
  const { data: allAvatars = [] } = useQuery({
    queryKey: ['all-avatars-globe'],
    queryFn: () => base44.entities.AvatarProfile.filter({ status: 'active' }, '-rating', 50),
  });

  const [globeSearch, setGlobeSearch] = useState('');
  const [focusCity, setFocusCity] = useState('');
  const [showGlobe, setShowGlobe] = useState(false);

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
           { label: 'Pending Requests', value: pendingBookings.length, icon: Inbox, color: 'text-yellow-400', path: '/AvatarRequests' },
           { label: 'Upcoming', value: todayBookings.length, icon: Calendar, color: 'text-blue-400', path: '/AvatarSchedule' },
           { label: 'Completed', value: completedCount, icon: CheckCircle, color: 'text-green-400', path: '/Bookings' },
           { label: 'Earnings', value: `$${profile?.total_earnings || 0}`, icon: TrendingUp, color: 'text-primary', path: '/AvatarEarnings' },
         ].map(stat => (
           <Link key={stat.label} to={stat.path}>
             <GlassCard className="p-5" hover>
               <div className="flex items-center justify-between mb-3">
                 <stat.icon className={`w-5 h-5 ${stat.color}`} />
               </div>
               <p className="text-2xl font-bold">{stat.value}</p>
               <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
             </GlassCard>
           </Link>
         ))}
       </div>

      {/* Pending Requests */}
      {pendingBookings.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pending Requests</h2>
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
                    <span className="text-sm font-medium text-primary">${b.total_amount || b.amount}</span>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}