import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Plus, MessageSquare, Settings,
  ArrowRight, Calendar, FileText, DollarSign, Clock, Rocket, Star
} from 'lucide-react';

const navItems = [
  { icon: Rocket, label: 'Deploy', path: '/CreateBooking' },
  { icon: Calendar, label: 'Sessions', path: '/Bookings' },
  { icon: MessageSquare, label: 'Messages', path: '/Messages' },
  { icon: Settings, label: 'Settings', path: '/EnterpriseSettings' },
];

export default function EnterpriseDashboard() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useCurrentUser();

  const { data: profile } = useQuery({
    queryKey: ['enterprise-profile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.EnterpriseProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['enterprise-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ client_email: user.email, client_type: 'enterprise' }, '-created_date', 10),
    enabled: !!user,
  });

  const { data: myReviews = [] } = useQuery({
    queryKey: ['enterprise-reviews', user?.email],
    queryFn: () => base44.entities.Review.filter({ reviewed_email: user.email }),
    enabled: !!user,
  });

  // Guard: redirect if user role is not 'enterprise'
  useEffect(() => {
    if (user && user.role !== 'enterprise') {
      const dest = user.role === 'user' ? '/UserDashboard' : '/AvatarDashboard';
      navigate(dest);
    }
  }, [user, navigate]);

  const avgRating = myReviews.length
    ? (myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length).toFixed(1)
    : null;

  if (userLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;
  if (user.role !== 'enterprise') return null;
  const activeBookings = bookings.filter(b => ['accepted', 'scheduled', 'in_progress', 'live'].includes(b.status));
  const totalSpend = bookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <AppShell navItems={navItems} user={user}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">
            {profile?.company_name || 'Enterprise'} Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Manage your remote presence deployments</p>
        </div>
      </div>

      {/* Primary CTA */}
      <GlassCard className="p-6 mb-8 border border-primary/20 glow-primary">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" /> Deploy an Avatar
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Find a human avatar and deploy them for site visits, inspections, training, and more.
            </p>
          </div>
          <Link to="/CreateBooking">
            <Button size="lg" className="bg-primary hover:bg-primary/90 glow-primary-sm shrink-0">
              <Plus className="w-5 h-5 mr-2" /> Deploy Avatar
            </Button>
          </Link>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {avgRating && (
          <GlassCard className="p-5 border border-yellow-500/20 col-span-2 lg:col-span-1">
            <Star className="w-5 h-5 text-yellow-400 mb-3 fill-yellow-400" />
            <div className="flex items-end gap-1.5">
              <p className="text-2xl font-bold">{avgRating}</p>
              <p className="text-xs text-muted-foreground mb-1">/ 5</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Avg Client Rating · {myReviews.length} review{myReviews.length !== 1 ? 's' : ''}</p>
          </GlassCard>
        )}
        {[
          { label: 'Active Sessions', value: activeBookings.length, icon: Calendar, color: 'text-blue-400' },
          { label: 'Total Bookings', value: bookings.length, icon: FileText, color: 'text-purple-400' },
          { label: 'Total Spend', value: `$${totalSpend.toLocaleString()}`, icon: DollarSign, color: 'text-green-400' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-yellow-400' },
        ].map(stat => (
          <GlassCard key={stat.label} className="p-5">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* No profile prompt */}
      {!profile && (
        <GlassCard className="p-6 mb-8 border border-yellow-500/20 bg-yellow-500/5">
          <p className="text-sm font-medium mb-1">Complete your company profile</p>
          <p className="text-xs text-muted-foreground mb-3">Add your company details to unlock enterprise features.</p>
          <Link to="/EnterpriseSettings">
            <Button size="sm" variant="outline">Set up profile →</Button>
          </Link>
        </GlassCard>
      )}

      {/* Recent Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Recent Sessions</h2>
          <Link to="/Bookings" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.slice(0, 6).map(b => (
              <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
                <GlassCard className="p-4 flex items-center justify-between" hover>
                  <div>
                    <p className="font-medium text-sm">{b.category}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {b.avatar_name} · {b.scheduled_date ? `${b.scheduled_date}${b.scheduled_time ? ` at ${b.scheduled_time}` : ''}` : 'Pending'} · {b.location || 'TBD'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">${b.total_amount || 0}</span>
                    <StatusBadge status={b.status} />
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        ) : (
          <GlassCard className="p-8 text-center">
            <Rocket className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No sessions yet. Deploy your first avatar.</p>
            <Link to="/CreateBooking">
              <Button size="sm" className="bg-primary hover:bg-primary/90">Deploy Avatar</Button>
            </Link>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}