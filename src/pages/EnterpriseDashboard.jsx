import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Home, FileText, Calendar, MessageSquare, Users, CreditCard, Heart, BarChart3, Settings,
  ArrowRight, Plus, Building2, DollarSign, Clock
} from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', path: '/EnterpriseDashboard' },
  { icon: FileText, label: 'Requests', path: '/EnterpriseRequests' },
  { icon: Calendar, label: 'Bookings', path: '/Bookings' },
  { icon: MessageSquare, label: 'Messages', path: '/Messages' },
  { icon: Users, label: 'Team', path: '/EnterpriseTeam' },
  { icon: CreditCard, label: 'Billing', path: '/EnterpriseBilling' },
  { icon: Heart, label: 'Favorites', path: '/Saved' },
  { icon: BarChart3, label: 'Reports', path: '/EnterpriseReports' },
  { icon: Settings, label: 'Settings', path: '/EnterpriseSettings' },
];

export default function EnterpriseDashboard() {
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

  if (userLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const activeBookings = bookings.filter(b => ['accepted', 'scheduled', 'in_progress', 'live'].includes(b.status));
  const totalSpend = bookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + (b.total_amount || 0), 0);

  return (
    <AppShell navItems={navItems} user={user}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">
            {profile?.company_name || 'Enterprise'} Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Manage your remote presence needs</p>
        </div>
        <Link to="/CreateBooking">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> New Booking
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Active Bookings', value: activeBookings.length, icon: Calendar, color: 'text-blue-400' },
          { label: 'Total Bookings', value: bookings.length, icon: FileText, color: 'text-purple-400' },
          { label: 'Total Spend', value: `$${totalSpend.toLocaleString()}`, icon: DollarSign, color: 'text-green-400' },
          { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, icon: Clock, color: 'text-yellow-400' },
        ].map(stat => (
          <GlassCard key={stat.label} className="p-5">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Link to="/CreateBooking"><GlassCard className="p-4 text-center" hover><Plus className="w-5 h-5 text-primary mx-auto mb-2" /><span className="text-sm font-medium">New Booking</span></GlassCard></Link>
        <Link to="/Explore"><GlassCard className="p-4 text-center" hover><Building2 className="w-5 h-5 text-blue-400 mx-auto mb-2" /><span className="text-sm font-medium">Find Avatars</span></GlassCard></Link>
        <Link to="/Messages"><GlassCard className="p-4 text-center" hover><MessageSquare className="w-5 h-5 text-green-400 mx-auto mb-2" /><span className="text-sm font-medium">Messages</span></GlassCard></Link>
        <Link to="/EnterpriseReports"><GlassCard className="p-4 text-center" hover><BarChart3 className="w-5 h-5 text-purple-400 mx-auto mb-2" /><span className="text-sm font-medium">Reports</span></GlassCard></Link>
      </div>

      {/* Recent Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Bookings</h2>
          <Link to="/Bookings" className="text-sm text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
        </div>
        {bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.slice(0, 5).map(b => (
              <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
                <GlassCard className="p-4 flex items-center justify-between" hover>
                  <div>
                    <p className="font-medium text-sm">{b.category}</p>
                    <p className="text-xs text-muted-foreground mt-1">{b.avatar_name} · {b.scheduled_date || 'Pending'} · {b.location || 'TBD'}</p>
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
            <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No bookings yet. Start by finding an avatar for your needs.</p>
            <Link to="/Explore"><Button size="sm" className="bg-primary hover:bg-primary/90">Find Avatars</Button></Link>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}