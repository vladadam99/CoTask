import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { getNavItems } from '@/lib/navItems';
import { Wallet, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function UserWallet() {
  const { user, loading } = useCurrentUser();

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['user-wallet-jobs', user?.email],
    queryFn: () => base44.entities.JobPost.filter({ posted_by_email: user.email }, '-updated_date', 100),
    enabled: !!user,
  });

  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['user-wallet-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ client_email: user.email }, '-updated_date', 100),
    enabled: !!user,
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const isLoading = isLoadingJobs || isLoadingBookings;

  const completedJobs = jobs.filter(j => j.status === 'completed');
  const pendingJobs = jobs.filter(j => ['in_progress', 'awaiting_approval'].includes(j.status));
  const paidBookings = bookings.filter(b => ['completed', 'in_progress', 'live'].includes(b.status));

  const totalSpentJobs = completedJobs.reduce((sum, j) => sum + (j.escrow_amount || j.budget_max || 0), 0);
  const totalSpentBookings = paidBookings.reduce((sum, b) => sum + (b.total_amount || b.amount || 0), 0);
  const totalSpent = totalSpentJobs + totalSpentBookings;
  const pendingEscrow = pendingJobs.reduce((sum, j) => sum + (j.escrow_amount || j.budget_max || 0), 0);

  // Build unified transaction list
  const transactions = [
    ...completedJobs.map(j => ({
      id: j.id,
      title: j.title,
      to: j.winner_email,
      amount: j.escrow_amount || j.budget_max || 0,
      date: j.ended_at || j.updated_date,
      status: 'released',
      type: 'job',
    })),
    ...paidBookings.map(b => ({
      id: b.id,
      title: `${b.category} Booking`,
      to: b.avatar_name,
      amount: b.total_amount || b.amount || 0,
      date: b.updated_date,
      status: b.status,
      type: 'booking',
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-2"><Wallet className="w-7 h-7 text-primary" /> My Wallet</h1>
        <p className="text-muted-foreground text-sm">Your spending overview and payment history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-primary" /></div>
            <span className="text-sm text-muted-foreground">Total Spent</span>
          </div>
          <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Across all completed jobs & bookings</p>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center"><Clock className="w-5 h-5 text-yellow-400" /></div>
            <span className="text-sm text-muted-foreground">In Escrow</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">${pendingEscrow.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">{pendingJobs.length} job{pendingJobs.length !== 1 ? 's' : ''} in progress · held securely</p>
        </GlassCard>
      </div>

      {/* Transaction History */}
      <h2 className="text-lg font-semibold mb-4">Payment History</h2>
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <GlassCard key={i} className="p-4 animate-pulse"><div className="h-4 bg-muted rounded w-1/3" /></GlassCard>)}</div>
      ) : transactions.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No transactions yet</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {transactions.map(tx => (
            <GlassCard key={tx.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.status === 'released' || tx.status === 'completed' ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                    {tx.status === 'released' || tx.status === 'completed'
                      ? <CheckCircle className="w-5 h-5 text-green-400" />
                      : <AlertCircle className="w-5 h-5 text-yellow-400" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tx.title}</p>
                    <p className="text-xs text-muted-foreground">To: {tx.to} · {new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-primary">-${tx.amount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{tx.status}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}