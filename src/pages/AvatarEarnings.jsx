import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import {
  Home, Inbox, Calendar, Radio, MessageSquare, DollarSign,
  Star, User, Settings, TrendingUp, ArrowUpRight, Wallet, Clock
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import PayoutSetup from '@/components/earnings/PayoutSetup';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="text-primary font-semibold">${payload[0].value.toFixed(2)}</p>
    </div>
  );
};

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
    queryFn: () => base44.entities.Booking.filter({ avatar_email: user.email, status: 'completed' }, '-created_date', 100),
    enabled: !!user,
  });

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = bookings.filter(b =>
      isWithinInterval(new Date(b.created_date), { start: startOfMonth(now), end: endOfMonth(now) })
    );
    const lastMonth = bookings.filter(b =>
      isWithinInterval(new Date(b.created_date), {
        start: startOfMonth(subMonths(now, 1)),
        end: endOfMonth(subMonths(now, 1))
      })
    );
    const total = bookings.reduce((s, b) => s + (b.amount || 0), 0);
    const thisMonthTotal = thisMonth.reduce((s, b) => s + (b.amount || 0), 0);
    const lastMonthTotal = lastMonth.reduce((s, b) => s + (b.amount || 0), 0);
    const growth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
    const avgPerJob = bookings.length ? total / bookings.length : 0;
    const totalHours = bookings.reduce((s, b) => s + (b.duration_minutes || 60) / 60, 0);

    // Monthly breakdown for chart — last 6 months
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i);
      const amount = bookings
        .filter(b => isWithinInterval(new Date(b.created_date), { start: startOfMonth(d), end: endOfMonth(d) }))
        .reduce((s, b) => s + (b.amount || 0), 0);
      return { month: format(d, 'MMM'), amount };
    });

    // Jobs per category
    const categoryMap = {};
    bookings.forEach(b => {
      categoryMap[b.category] = (categoryMap[b.category] || 0) + (b.amount || 0);
    });
    const categoryData = Object.entries(categoryMap)
      .map(([cat, amount]) => ({ cat, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    return { total, thisMonthTotal, lastMonthTotal, growth, avgPerJob, totalHours, monthlyData, categoryData };
  }, [bookings]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <AppShell navItems={navItems} user={user}>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1">Earnings Dashboard</h1>
        <p className="text-muted-foreground text-sm">Your financial performance at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Earned', value: `$${stats.total.toFixed(2)}`,
            icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10',
          },
          {
            label: 'This Month', value: `$${stats.thisMonthTotal.toFixed(2)}`,
            icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10',
            sub: stats.growth !== 0 ? `${stats.growth > 0 ? '+' : ''}${stats.growth.toFixed(0)}% vs last month` : null,
          },
          {
            label: 'Avg Per Job', value: `$${stats.avgPerJob.toFixed(0)}`,
            icon: Wallet, color: 'text-blue-400', bg: 'bg-blue-500/10',
          },
          {
            label: 'Hours Worked', value: `${stats.totalHours.toFixed(1)}h`,
            icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10',
          },
        ].map(stat => (
          <GlassCard key={stat.label} className="p-5">
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            {stat.sub && (
              <p className={`text-xs mt-1 flex items-center gap-0.5 ${stats.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                <ArrowUpRight className="w-3 h-3" /> {stat.sub}
              </p>
            )}
          </GlassCard>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly earnings area chart */}
        <GlassCard className="p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold mb-5">Monthly Earnings (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.monthlyData}>
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(355 80% 48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(355 80% 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(220 10% 55%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(220 10% 55%)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone" dataKey="amount" stroke="hsl(355 80% 48%)"
                strokeWidth={2} fill="url(#earningsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Earnings by category bar chart */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold mb-5">By Category</h2>
          {stats.categoryData.length === 0 ? (
            <p className="text-xs text-muted-foreground mt-8 text-center">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.categoryData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(220 10% 55%)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="cat" tick={{ fontSize: 10, fill: 'hsl(220 10% 55%)' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="hsl(355 80% 48%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>

      {/* Payout status */}
      {profile && (
        <GlassCard className="p-5 mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm mb-1">Payout Account</p>
            <p className="text-xs text-muted-foreground">
              {profile.payout_status === 'active'
                ? 'Connected and active — earnings are paid out automatically.'
                : profile.payout_status === 'pending'
                ? "Setup in progress — we'll notify you when it's ready."
                : 'Not connected — set up payouts to receive your funds.'}
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
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {b.created_date ? format(new Date(b.created_date), 'MMM d, yyyy') : ''}
                    {b.duration_minutes ? ` · ${b.duration_minutes} min` : ''}
                  </p>
                </div>
                <span className="text-green-400 font-semibold text-sm shrink-0">+${b.amount || 0}</span>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}