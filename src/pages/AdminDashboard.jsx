import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  LayoutDashboard, Users, Radio, Building2, Calendar, DollarSign, Shield,
  Flag, Star, Settings, ArrowRight, TrendingUp, AlertTriangle
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/AdminDashboard' },
  { icon: Users, label: 'Users', path: '/AdminUsers' },
  { icon: Radio, label: 'Avatars', path: '/AdminAvatars' },
  { icon: Building2, label: 'Enterprises', path: '/AdminEnterprises' },
  { icon: Calendar, label: 'Bookings', path: '/AdminBookings' },
  { icon: Star, label: 'Reviews', path: '/AdminReviews' },
  { icon: Flag, label: 'Disputes', path: '/AdminDisputes' },
  { icon: Shield, label: 'Verification', path: '/AdminVerification' },
  { icon: Settings, label: 'Settings', path: '/AdminSettings' },
];

export default function AdminDashboard() {
  const { user, loading: userLoading } = useCurrentUser();

  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => base44.entities.User.list('-created_date', 100) });
  const { data: avatars = [] } = useQuery({ queryKey: ['admin-avatars'], queryFn: () => base44.entities.AvatarProfile.list('-created_date', 100) });
  const { data: enterprises = [] } = useQuery({ queryKey: ['admin-enterprises'], queryFn: () => base44.entities.EnterpriseProfile.list('-created_date', 100) });
  const { data: bookings = [] } = useQuery({ queryKey: ['admin-bookings'], queryFn: () => base44.entities.Booking.list('-created_date', 50) });
  const { data: reviews = [] } = useQuery({ queryKey: ['admin-reviews'], queryFn: () => base44.entities.Review.list('-created_date', 20) });

  if (userLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-sm">You need admin privileges to access this page.</p>
        </GlassCard>
      </div>
    );
  }

  const totalRevenue = bookings.filter(b => b.payment_status === 'paid').reduce((s, b) => s + (b.total_amount || 0), 0);
  const pendingVerifications = avatars.filter(a => a.verification_status === 'submitted').length;
  const disputedBookings = bookings.filter(b => b.status === 'disputed').length;

  return (
    <AppShell navItems={navItems} user={user}>
      <h1 className="text-2xl lg:text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground text-sm mb-8">Platform overview and management</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-400' },
          { label: 'Avatars', value: avatars.length, icon: Radio, color: 'text-primary' },
          { label: 'Enterprises', value: enterprises.length, icon: Building2, color: 'text-purple-400' },
          { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-400' },
        ].map(stat => (
          <GlassCard key={stat.label} className="p-5">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Total Bookings', value: bookings.length, icon: Calendar },
          { label: 'Pending Verification', value: pendingVerifications, icon: Shield },
          { label: 'Open Disputes', value: disputedBookings, icon: Flag },
        ].map(stat => (
          <GlassCard key={stat.label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className="w-4 h-4 text-muted-foreground" />
              {stat.value > 0 && <span className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Bookings</h2>
          <Link to="/AdminBookings" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {bookings.slice(0, 8).map(b => (
            <GlassCard key={b.id} className="p-3 flex items-center justify-between text-sm" hover>
              <div className="flex items-center gap-4">
                <span className="font-medium">{b.category}</span>
                <span className="text-muted-foreground">{b.client_name} → {b.avatar_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">${b.total_amount || 0}</span>
                <StatusBadge status={b.status} />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Recent Reviews */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Reviews</h2>
        <div className="space-y-2">
          {reviews.slice(0, 5).map(r => (
            <GlassCard key={r.id} className="p-3 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{r.reviewer_name}</span>
                <span className="text-muted-foreground"> reviewed </span>
                <span className="font-medium">{r.avatar_name}</span>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted'}`} />
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </AppShell>
  );
}