import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { getNavItems } from '@/lib/navItems';
import { Wallet, TrendingUp, DollarSign, CheckCircle, Clock } from 'lucide-react';

const PLATFORM_FEE = 0.1; // 10%

export default function AvatarWallet() {
  const { user, loading } = useCurrentUser();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['avatar-wallet-jobs', user?.email],
    queryFn: () => base44.entities.JobPost.filter({ winner_email: user.email }, '-updated_date', 100),
    enabled: !!user,
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const completedJobs = jobs.filter(j => j.status === 'completed');
  const pendingJobs = jobs.filter(j => ['in_progress', 'awaiting_approval'].includes(j.status));

  const totalGross = completedJobs.reduce((sum, j) => sum + (j.escrow_amount || j.budget_max || 0), 0);
  const totalFees = totalGross * PLATFORM_FEE;
  const totalNet = totalGross - totalFees;
  const pendingAmount = pendingJobs.reduce((sum, j) => sum + (j.escrow_amount || j.budget_max || 0), 0);

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-2"><Wallet className="w-7 h-7 text-primary" /> My Wallet</h1>
        <p className="text-muted-foreground text-sm">Your earnings overview and payment history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-400" /></div>
            <span className="text-sm text-muted-foreground">Available Balance</span>
          </div>
          <p className="text-2xl font-bold text-green-400">${totalNet.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">After 10% platform fee</p>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center"><Clock className="w-5 h-5 text-yellow-400" /></div>
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">${pendingAmount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">{pendingJobs.length} job{pendingJobs.length !== 1 ? 's' : ''} in progress</p>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-primary" /></div>
            <span className="text-sm text-muted-foreground">Total Fees Paid</span>
          </div>
          <p className="text-2xl font-bold text-primary">${totalFees.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">10% platform fee</p>
        </GlassCard>
      </div>

      {/* Transaction History */}
      <h2 className="text-lg font-semibold mb-4">Payment History</h2>
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <GlassCard key={i} className="p-4 animate-pulse"><div className="h-4 bg-muted rounded w-1/3" /></GlassCard>)}</div>
      ) : completedJobs.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No completed jobs yet</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {completedJobs.map(job => {
            const gross = job.escrow_amount || job.budget_max || 0;
            const fee = gross * PLATFORM_FEE;
            const net = gross - fee;
            return (
              <GlassCard key={job.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{job.title}</p>
                      <p className="text-xs text-muted-foreground">Client: {job.posted_by_name} · {job.ended_at ? new Date(job.ended_at).toLocaleDateString() : new Date(job.updated_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-green-400">+${net.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Gross: ${gross.toFixed(2)} · Fee: -${fee.toFixed(2)}</p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}