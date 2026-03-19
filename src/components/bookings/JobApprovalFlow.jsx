import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, DollarSign, MessageSquare, Shield, Loader2 } from 'lucide-react';

export default function JobApprovalFlow({ booking, user, onUpdate }) {
  const [mode, setMode] = useState(null); // 'approve' | 'partial' | 'dispute'
  const [partialAmount, setPartialAmount] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [loading, setLoading] = useState(false);

  const isClient = user?.email === booking.client_email;
  const isAvatar = user?.email === booking.avatar_email;

  const handleApprove = async () => {
    setLoading(true);
    await base44.entities.Booking.update(booking.id, {
      approval_status: 'approved',
      status: 'completed',
      payment_status: 'released',
    });
    // Notify avatar
    await base44.entities.Notification.create({
      user_email: booking.avatar_email,
      title: '✅ Job Approved — Payment Released',
      message: `${user.full_name} approved your work. Payment of $${booking.amount?.toFixed(2)} has been released.`,
      type: 'payment',
      reference_id: booking.id,
    });
    setLoading(false);
    onUpdate?.();
  };

  const handlePartial = async () => {
    const amt = parseFloat(partialAmount);
    if (!amt || amt <= 0 || amt > (booking.total_amount || 0)) return;
    setLoading(true);
    await base44.entities.Booking.update(booking.id, {
      approval_status: 'partial',
      status: 'completed',
      payment_status: 'partial',
      partial_amount: amt,
    });
    await base44.entities.Notification.create({
      user_email: booking.avatar_email,
      title: 'Partial Payment Offer',
      message: `${user.full_name} has offered a partial payment of $${amt.toFixed(2)} for this job.`,
      type: 'payment',
      reference_id: booking.id,
    });
    setLoading(false);
    onUpdate?.();
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) return;
    setLoading(true);
    await base44.entities.Booking.update(booking.id, {
      approval_status: 'disputed',
      status: 'disputed',
      payment_status: 'held',
      dispute_reason: disputeReason,
    });
    await base44.entities.Notification.create({
      user_email: booking.avatar_email,
      title: '⚠️ Dispute Raised',
      message: `${user.full_name} has raised a dispute: "${disputeReason.slice(0, 80)}"`,
      type: 'system',
      reference_id: booking.id,
    });
    setLoading(false);
    onUpdate?.();
  };

  // Avatar sees dispute status
  if (isAvatar) {
    if (booking.status === 'awaiting_approval') {
      return (
        <GlassCard className="p-5 border-yellow-500/20">
          <div className="flex items-center gap-2 mb-2 text-yellow-400">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-semibold">Awaiting Client Approval</span>
          </div>
          <p className="text-xs text-muted-foreground">The client is reviewing your proof. Payment is held until they approve. You'll be notified of their decision.</p>
        </GlassCard>
      );
    }
    if (booking.approval_status === 'disputed') {
      return (
        <GlassCard className="p-5 border-red-500/20">
          <div className="flex items-center gap-2 mb-2 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-semibold">Dispute In Progress</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Client reason: <span className="text-foreground">"{booking.dispute_reason}"</span></p>
          <p className="text-xs text-muted-foreground">Funds are held. Our team will review and contact both parties within 48 hours.</p>
        </GlassCard>
      );
    }
    if (booking.approval_status === 'partial') {
      return (
        <GlassCard className="p-5 border-yellow-500/20">
          <div className="flex items-center gap-2 mb-2 text-yellow-400">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-semibold">Partial Payment Offered</span>
          </div>
          <p className="text-xs text-muted-foreground">Client has offered <span className="text-foreground font-semibold">${booking.partial_amount?.toFixed(2)}</span> (of ${booking.total_amount?.toFixed(2)} total).</p>
        </GlassCard>
      );
    }
    return null;
  }

  // Client sees approval options
  if (!isClient || booking.status !== 'awaiting_approval') return null;

  if (mode === 'approve') {
    return (
      <GlassCard className="p-5 border-green-500/20">
        <h3 className="font-semibold text-sm mb-3 text-green-400 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Confirm Approval</h3>
        <p className="text-sm text-muted-foreground mb-4">You're about to release the full payment of <strong className="text-foreground">${booking.total_amount?.toFixed(2)}</strong> to the avatar. This cannot be undone.</p>
        <div className="flex gap-2">
          <Button className="flex-1 bg-green-600 hover:bg-green-700 gap-2" onClick={handleApprove} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Confirm & Pay
          </Button>
          <Button variant="outline" className="border-white/10" onClick={() => setMode(null)}>Back</Button>
        </div>
      </GlassCard>
    );
  }

  if (mode === 'partial') {
    return (
      <GlassCard className="p-5 border-yellow-500/20">
        <h3 className="font-semibold text-sm mb-3 text-yellow-400 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Partial Payment</h3>
        <p className="text-sm text-muted-foreground mb-3">How much would you like to pay? (Max: ${booking.total_amount?.toFixed(2)})</p>
        <input
          type="number"
          min="1"
          max={booking.total_amount}
          step="0.01"
          value={partialAmount}
          onChange={e => setPartialAmount(e.target.value)}
          placeholder={`e.g. ${(booking.total_amount / 2).toFixed(2)}`}
          className="w-full text-sm bg-muted/50 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:border-primary/40 text-foreground mb-3"
        />
        <div className="flex gap-2">
          <Button className="flex-1 bg-yellow-600 hover:bg-yellow-700" onClick={handlePartial} disabled={loading || !partialAmount}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Offer Partial Payment'}
          </Button>
          <Button variant="outline" className="border-white/10" onClick={() => setMode(null)}>Back</Button>
        </div>
      </GlassCard>
    );
  }

  if (mode === 'dispute') {
    return (
      <GlassCard className="p-5 border-red-500/20">
        <h3 className="font-semibold text-sm mb-3 text-red-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Raise a Dispute</h3>
        <p className="text-sm text-muted-foreground mb-3">Funds will be held until our team reviews the case. Please describe the issue clearly.</p>
        <textarea
          value={disputeReason}
          onChange={e => setDisputeReason(e.target.value)}
          rows={3}
          placeholder="What went wrong with this job?"
          className="w-full text-sm bg-muted/50 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground resize-none mb-3"
        />
        <div className="flex gap-2">
          <Button className="flex-1 bg-red-600 hover:bg-red-700 gap-2" onClick={handleDispute} disabled={loading || !disputeReason.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><AlertTriangle className="w-4 h-4" /> Submit Dispute</>}
          </Button>
          <Button variant="outline" className="border-white/10" onClick={() => setMode(null)}>Back</Button>
        </div>
      </GlassCard>
    );
  }

  // Default: choose action
  return (
    <GlassCard className="p-5 border-primary/20">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Review Job Proof</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">The avatar has submitted their proof of completion. Choose how to proceed — your funds are safely held until you decide.</p>
      <div className="grid grid-cols-1 gap-2">
        <Button className="w-full bg-green-600 hover:bg-green-700 gap-2" onClick={() => setMode('approve')}>
          <CheckCircle className="w-4 h-4" /> Happy — Release Full Payment
        </Button>
        <Button className="w-full bg-yellow-600 hover:bg-yellow-700 gap-2" onClick={() => setMode('partial')}>
          <DollarSign className="w-4 h-4" /> Not Fully Satisfied — Pay Partially
        </Button>
        <Button className="w-full bg-red-600/80 hover:bg-red-600 gap-2" onClick={() => setMode('dispute')}>
          <AlertTriangle className="w-4 h-4" /> Not Happy — Raise a Dispute
        </Button>
      </div>
    </GlassCard>
  );
}