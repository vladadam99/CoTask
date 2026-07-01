import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { EmptyState, MetricCard, PageHero, SectionTitle } from '@/components/ui/PagePrimitives';
import { Link } from 'react-router-dom';
import { getNavItems } from '@/lib/navItems';
import {
  DollarSign, TrendingUp, Wallet, Clock, Receipt
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import PayoutSetup from '@/components/earnings/PayoutSetup';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';



const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass border border-border rounded-lg px-3 py-2 text-xs">
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

    // Monthly breakdown for chart ??? last 6 months
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
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1">Earnings Dashboard</h1>
        <p className="text-muted-foreground text-sm">Your financial performance at a glance</p>
      </div>

      <PageHero
        eyebrow="Agent finance"
        title="Earnings Dashboard"
        description="Track completed work, payout readiness, and monthly earnings without digging through old task records."
        icon={Wallet}
        stats={[
          { label: 'Total earned', value: `$${stats.total.toFixed(2)}` },
          { label: 'This month', value: `$${stats.thisMonthTotal.toFixed(2)}` },
          { label: 'Completed tasks', value: bookings.length },
        ]}
        className="mb-6"
      />

      <div className="dashboard-grid mb-8">
        {[
          {
            label: 'Total Earned', value: `$${stats.total.toFixed(2)}`,
            icon: DollarSign, tone: 'primary',
          },
          {
            label: 'This Month', value: `$${stats.thisMonthTotal.toFixed(2)}`,
            icon: TrendingUp, tone: 'green',
            hint: stats.growth !== 0 ? `${stats.growth > 0 ? '+' : ''}${stats.growth.toFixed(0)}% vs last month` : 'No previous month comparison yet',
          },
          {
            label: 'Avg Per Task', value: `$${stats.avgPerJob.toFixed(0)}`,
            icon: Wallet, tone: 'blue',
          },
          {
            label: 'Hours Worked', value: `${stats.totalHours.toFixed(1)}h`,
            icon: Clock, tone: 'amber',
          },
        ].map(stat => <MetricCard key={stat.label} {...stat} />)}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly earnings area chart */}
        <GlassCard className="p-5 lg:col-span-2">
          <SectionTitle title="Monthly Earnings" description="Last 6 months, based on completed tasks." className="mb-5" />
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
          <SectionTitle title="By Category" description="Where your paid work is coming from." className="mb-5" />
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

      {/* Automated Payout Setup */}
      {user && <PayoutSetup avatarEmail={user.email} />}

      {/* Transaction history */}
      <SectionTitle
        eyebrow="Payout record"
        title="Transaction History"
        description="Completed tasks appear here once they are ready for payout tracking."
        className="mb-4"
      />
      {bookings.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No completed tasks yet"
          description="Your completed task payments and payout notes will collect here."
        />
      ) : (
        <div className="space-y-2">
          {bookings.map(b => (
            <Link key={b.id} to={`/AvatarBookingDetail?id=${b.id}`}>
              <GlassCard className="p-4 flex items-center justify-between gap-4" hover>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.category} ??? {b.client_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {b.created_date ? format(new Date(b.created_date), 'MMM d, yyyy') : ''}
                    {b.duration_minutes ? ` ?? ${b.duration_minutes} min` : ''}
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

