import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useSearchParams } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { getNavItems } from '@/lib/navItems';
import { Wallet, TrendingUp, DollarSign, CheckCircle, Clock, Download, ArrowUpRight, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { EmptyState, PageHero, SectionTitle } from '@/components/ui/PagePrimitives';
import PayoutSetup from '@/components/earnings/PayoutSetup';

const PLATFORM_FEE_RATE = 0.1;

function downloadInvoice(job, userName, role) {
  const doc = new jsPDF();
  const gross = job.total_amount || job.amount || job.escrow_amount || job.budget_max || 0;
  const fee = gross * PLATFORM_FEE_RATE;
  const net = gross - fee;
  const date = job.released_at ? new Date(job.released_at).toLocaleDateString() : (job.ended_at ? new Date(job.ended_at).toLocaleDateString() : new Date(job.updated_date).toLocaleDateString());
  const invoiceNo = `INV-${job.id.slice(-6).toUpperCase()}`;

  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('CoTask Invoice', 20, 25);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoiceNo}`, 20, 38);
  doc.text(`Date: ${date}`, 20, 45);
  doc.text(`Role: ${role === 'avatar' ? 'Local Agent' : 'Client'}`, 20, 52);
  doc.text(`Name: ${userName}`, 20, 59);
  doc.text(`Account: Earnings record`, 20, 66);

  doc.line(20, 72, 190, 72);
  doc.setFont('helvetica', 'bold');
  doc.text('Task Details', 20, 82);
  doc.setFont('helvetica', 'normal');
  doc.text(`Title: ${job.is_booking ? `${job.category} Task` : job.title}`, 20, 92);
  doc.text(`Category: ${job.category || '-'}`, 20, 99);
  doc.text(`Client: ${job.client_name || job.posted_by_name}`, 20, 106);

  doc.line(20, 114, 190, 114);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Breakdown', 20, 124);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gross Amount:`, 20, 134); doc.text(`$${gross.toFixed(2)}`, 160, 134);
  doc.text(`Platform Fee (10%):`, 20, 141); doc.text(`-$${fee.toFixed(2)}`, 160, 141);
  doc.setFont('helvetica', 'bold');
  doc.text(`Net Earned:`, 20, 152); doc.text(`$${net.toFixed(2)}`, 160, 152);

  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text('CoTask Platform · cotask.app · support@cotask.app', 20, 280);
  doc.save(`cotask-invoice-${invoiceNo}.pdf`);
}

export default function AvatarWallet() {
  const { user, loading } = useCurrentUser();
  const [searchParams] = useSearchParams();
  const payoutSettingsRef = useRef(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank_transfer');
  const [withdrawDone, setWithdrawDone] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['avatar-wallet-jobs', user?.email],
    queryFn: () => base44.entities.JobPost.filter({ winner_email: user.email }, '-updated_date', 100),
    enabled: !!user,
  });

  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['avatar-wallet-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ avatar_email: user.email }, '-updated_date', 100),
    enabled: !!user,
  });

  const isLoadingTotal = isLoading || isLoadingBookings;

  useEffect(() => {
    if (searchParams.get('payout') !== 'settings') return;
    const timer = window.setTimeout(() => {
      payoutSettingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  if (loading || isLoadingTotal) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const releasedJobs = jobs.filter(j => j.payment_status === 'released' || j.status === 'completed');
  const releasedBookings = bookings.filter(b => b.payment_status === 'released' || b.status === 'completed');
  const heldJobs = jobs.filter(j => j.payment_status === 'held');
  const heldBookings = bookings.filter(b => b.payment_status === 'held');

  const totalGrossJobs = releasedJobs.reduce((sum, j) => sum + (j.escrow_amount || j.budget_max || 0), 0);
  const totalGrossBookings = releasedBookings.reduce((sum, b) => sum + (b.total_amount || b.amount || 0), 0);
  const totalGross = totalGrossJobs + totalGrossBookings;
  
  const totalFees = totalGross * PLATFORM_FEE_RATE;
  const totalNet = totalGross - totalFees;

  const pendingAmountJobs = heldJobs.reduce((sum, j) => sum + (j.escrow_amount || j.budget_max || 0), 0);
  const pendingAmountBookings = heldBookings.reduce((sum, b) => sum + (b.total_amount || b.amount || 0), 0);
  const pendingAmount = pendingAmountJobs + pendingAmountBookings;

  const pendingCount = heldJobs.length + heldBookings.length;
  const completedCount = releasedJobs.length + releasedBookings.length;
  
  const allReleasedTasks = [
    ...releasedJobs.map(j => ({ ...j, is_job: true })),
    ...releasedBookings.map(b => ({ ...b, is_booking: true }))
  ].sort((a, b) => new Date(b.released_at || b.updated_date) - new Date(a.released_at || a.updated_date));

  return (
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
      {/* Payout request modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="surface-panel rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Request Payout</h2>
              <button onClick={() => { setShowWithdraw(false); setWithdrawDone(false); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            {withdrawDone ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="font-semibold">Payout Request Saved</p>
                <p className="text-sm text-muted-foreground mt-1">Payouts are reviewed and processed manually during Production V1.</p>
                <button onClick={() => { setShowWithdraw(false); setWithdrawDone(false); setWithdrawAmount(''); }} className="mt-4 w-full bg-primary text-primary-foreground rounded-xl py-2 text-sm font-medium">Close</button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">Available: <span className="text-green-400 font-bold">${totalNet.toFixed(2)}</span></p>
                <label className="text-xs text-muted-foreground mb-1 block">Amount (USD)</label>
                <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="0.00" className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm mb-3 outline-none" />
                <label className="text-xs text-muted-foreground mb-1 block">Payout Method</label>
                <select value={withdrawMethod} onChange={e => setWithdrawMethod(e.target.value)} className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm mb-4 outline-none">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="wise">Wise</option>
                </select>
                <button
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > totalNet}
                  onClick={() => setWithdrawDone(true)}
                  className="w-full bg-primary text-primary-foreground rounded-xl py-2 text-sm font-medium disabled:opacity-40">
                  Request Manual Payout
                </button>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Payouts are reviewed and processed manually during Production V1.</p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
      <PageHero
        eyebrow="Payments"
        title="Earnings & Payouts"
        description="Track completed tasks, pending Secure Payments, payout settings, and downloadable invoices."
        icon={Wallet}
        actions={<button onClick={() => setShowWithdraw(true)} className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90"><ArrowUpRight className="w-4 h-4" /> Request Payout</button>}
        stats={[
          { label: 'Available', value: `$${totalNet.toFixed(2)}` },
          { label: 'Pending', value: `$${pendingAmount.toFixed(2)}` },
          { label: 'Completed', value: completedCount },
        ]}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-400" /></div>
            <span className="text-sm text-muted-foreground">Available Earnings</span>
          </div>
          <p className="text-2xl font-bold text-green-400">${totalNet.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">After 10% platform fee</p>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center"><Clock className="w-5 h-5 text-yellow-400" /></div>
            <span className="text-sm text-muted-foreground">Pending Secure Payments</span>
          </div>
          <p className="text-2xl font-bold text-yellow-400">${pendingAmount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">{pendingCount} task{pendingCount !== 1 ? 's' : ''} in progress</p>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-primary" /></div>
            <span className="text-sm text-muted-foreground">Total Earned (Gross)</span>
          </div>
          <p className="text-2xl font-bold text-primary">${totalGross.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">{completedCount} completed task{completedCount !== 1 ? 's' : ''}</p>
        </GlassCard>
      </div>

      <div ref={payoutSettingsRef} className="scroll-mt-24">
        <PayoutSetup avatarEmail={user?.email} />
      </div>

      {/* Transaction History */}
      <SectionTitle title="Payment History" description="Completed payouts and invoice records." />
      {allReleasedTasks.length === 0 ? (
        <EmptyState icon={Wallet} title="No completed tasks yet" description="Your earnings history will appear here." />
      ) : (
        <div className="space-y-3">
          {allReleasedTasks.map(job => {
            const gross = job.total_amount || job.amount || job.escrow_amount || job.budget_max || 0;
            const fee = gross * PLATFORM_FEE_RATE;
            const net = gross - fee;
            return (
              <GlassCard key={job.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{job.is_booking ? `${job.category} Task` : job.title}</p>
                      <p className="text-xs text-muted-foreground">Client: {job.client_name || job.posted_by_name} · {job.released_at ? new Date(job.released_at).toLocaleDateString() : (job.ended_at ? new Date(job.ended_at).toLocaleDateString() : new Date(job.updated_date).toLocaleDateString())}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-green-400">+${net.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mb-1">Gross: ${gross.toFixed(2)} · Fee: -${fee.toFixed(2)}</p>
                    <button onClick={() => downloadInvoice(job, user.full_name, 'avatar')} className="flex items-center gap-1 text-xs text-primary hover:underline ml-auto">
                      <Download className="w-3 h-3" /> Invoice PDF
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
      </div>
    </AppShell>
  );
}
