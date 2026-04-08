import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { getNavItems } from '@/lib/navItems';
import { Wallet, TrendingUp, DollarSign, CheckCircle, Clock, Download, ArrowUpRight, X } from 'lucide-react';
import { jsPDF } from 'jspdf';

const PLATFORM_FEE_RATE = 0.1;

function downloadInvoice(job, userEmail, userName, role) {
  const doc = new jsPDF();
  const gross = job.escrow_amount || job.budget_max || 0;
  const fee = gross * PLATFORM_FEE_RATE;
  const net = gross - fee;
  const date = job.ended_at ? new Date(job.ended_at).toLocaleDateString() : new Date(job.updated_date).toLocaleDateString();
  const invoiceNo = `INV-${job.id.slice(-6).toUpperCase()}`;

  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('CoTask Invoice', 20, 25);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoiceNo}`, 20, 38);
  doc.text(`Date: ${date}`, 20, 45);
  doc.text(`Role: ${role === 'avatar' ? 'Avatar (Worker)' : 'Client'}`, 20, 52);
  doc.text(`Name: ${userName}`, 20, 59);
  doc.text(`Email: ${userEmail}`, 20, 66);

  doc.line(20, 72, 190, 72);
  doc.setFont('helvetica', 'bold');
  doc.text('Job Details', 20, 82);
  doc.setFont('helvetica', 'normal');
  doc.text(`Title: ${job.title}`, 20, 92);
  doc.text(`Category: ${job.category || '-'}`, 20, 99);
  doc.text(`Client: ${job.posted_by_name}`, 20, 106);

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
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank_transfer');
  const [withdrawDone, setWithdrawDone] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['avatar-wallet-jobs', user?.email],
    queryFn: () => base44.entities.JobPost.filter({ winner_email: user.email }, '-updated_date', 100),
    enabled: !!user,
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const completedJobs = jobs.filter(j => j.status === 'completed');
  const pendingJobs = jobs.filter(j => ['in_progress', 'awaiting_approval'].includes(j.status));

  const totalGross = completedJobs.reduce((sum, j) => sum + (j.escrow_amount || j.budget_max || 0), 0);
  const totalFees = totalGross * PLATFORM_FEE_RATE;
  const totalNet = totalGross - totalFees;
  const pendingAmount = pendingJobs.reduce((sum, j) => sum + (j.escrow_amount || j.budget_max || 0), 0);

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-strong border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Withdraw Funds</h2>
              <button onClick={() => { setShowWithdraw(false); setWithdrawDone(false); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            {withdrawDone ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="font-semibold">Withdrawal Requested!</p>
                <p className="text-sm text-muted-foreground mt-1">Your request is being processed (1-3 business days).</p>
                <button onClick={() => { setShowWithdraw(false); setWithdrawDone(false); setWithdrawAmount(''); }} className="mt-4 w-full bg-primary text-primary-foreground rounded-xl py-2 text-sm font-medium">Close</button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">Available: <span className="text-green-400 font-bold">${totalNet.toFixed(2)}</span></p>
                <label className="text-xs text-muted-foreground mb-1 block">Amount (USD)</label>
                <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="0.00" className="w-full bg-muted/50 border border-white/10 rounded-xl px-3 py-2 text-sm mb-3 outline-none" />
                <label className="text-xs text-muted-foreground mb-1 block">Payout Method</label>
                <select value={withdrawMethod} onChange={e => setWithdrawMethod(e.target.value)} className="w-full bg-muted/50 border border-white/10 rounded-xl px-3 py-2 text-sm mb-4 outline-none">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="wise">Wise</option>
                </select>
                <button
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > totalNet}
                  onClick={() => setWithdrawDone(true)}
                  className="w-full bg-primary text-primary-foreground rounded-xl py-2 text-sm font-medium disabled:opacity-40">
                  Request Withdrawal
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-2"><Wallet className="w-7 h-7 text-primary" /> My Wallet</h1>
            <p className="text-muted-foreground text-sm">Your earnings overview and payment history</p>
          </div>
          <button onClick={() => setShowWithdraw(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <ArrowUpRight className="w-4 h-4" /> Withdraw
          </button>
        </div>
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
                      <p className="font-medium text-sm">{job.title}</p>
                      <p className="text-xs text-muted-foreground">Client: {job.posted_by_name} · {job.ended_at ? new Date(job.ended_at).toLocaleDateString() : new Date(job.updated_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-green-400">+${net.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mb-1">Gross: ${gross.toFixed(2)} · Fee: -${fee.toFixed(2)}</p>
                    <button onClick={() => downloadInvoice(job, user.email, user.full_name, 'avatar')} className="flex items-center gap-1 text-xs text-primary hover:underline ml-auto">
                      <Download className="w-3 h-3" /> Invoice PDF
                    </button>
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