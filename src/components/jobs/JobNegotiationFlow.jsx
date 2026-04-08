import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import { AlertTriangle, Loader2, CheckCircle, X, DollarSign, ArrowRight } from 'lucide-react';

/**
 * Negotiation flow for job applications.
 * Works between job owner (client) and avatar applicant.
 * Uses CounterOffer entity with booking_id = "job_" + application.id
 */
export default function JobNegotiationFlow({ application, job, user, onRateAgreed }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const refId = `job_${application?.id}`;
  const isOwner = user?.email === job?.posted_by_email;
  const isApplicant = user?.email === application?.applicant_email;

  const { data: offers = [] } = useQuery({
    queryKey: ['job-neg', application?.id],
    queryFn: () => base44.entities.CounterOffer.filter({ booking_id: refId }, '-created_date', 20),
    enabled: !!application?.id,
    refetchInterval: 5000,
  });

  const latestOffer = offers[0];
  const myTurn = latestOffer
    ? (latestOffer.status === 'pending' &&
       latestOffer.offered_by_email !== user?.email &&
       ((isOwner && latestOffer.offered_by_role === 'avatar') ||
        (isApplicant && latestOffer.offered_by_role === 'client')))
    : false;

  const canNegotiate = (isOwner || isApplicant) &&
    application?.status === 'pending' &&
    job?.status === 'open';

  const sendOffer = async () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    setSending(true);

    await base44.entities.CounterOffer.create({
      booking_id: refId,
      offered_by_email: user.email,
      offered_by_name: user.full_name,
      offered_by_role: isOwner ? 'client' : 'avatar',
      amount: parseFloat(amount),
      note: note.trim(),
      status: 'pending',
    });

    const targetEmail = isOwner ? application.applicant_email : job.posted_by_email;
    const targetRole = isOwner ? 'avatar' : 'user';
    await base44.entities.Notification.create({
      user_email: targetEmail,
      title: `${user.full_name} made a counter-offer on "${job.title}"`,
      message: `Proposed rate: $${parseFloat(amount).toFixed(2)}${note ? ` — "${note}"` : ''}`,
      type: 'booking_request',
      reference_id: job.id,
      link: `/JobDetail?id=${job.id}`,
      target_role: targetRole,
    });

    setAmount('');
    setNote('');
    setShowForm(false);
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ['job-neg', application.id] });
  };

  const respondToOffer = async (offerId, accept) => {
    await base44.entities.CounterOffer.update(offerId, { status: accept ? 'accepted' : 'declined' });

    const targetEmail = isOwner ? application.applicant_email : job.posted_by_email;
    const targetRole = isOwner ? 'avatar' : 'user';
    const agreedAmount = latestOffer.amount;

    if (accept) {
      // Update application with agreed rate
      await base44.entities.JobApplication.update(application.id, { proposed_rate: agreedAmount });
      await base44.entities.Notification.create({
        user_email: targetEmail,
        title: `Rate of $${agreedAmount.toFixed(2)} accepted for "${job.title}"`,
        message: `${user.full_name} accepted your offer. Proceeding with payment.`,
        type: 'payment',
        reference_id: job.id,
        link: `/JobDetail?id=${job.id}`,
        target_role: targetRole,
      });
      queryClient.invalidateQueries({ queryKey: ['job-neg', application.id] });
      onRateAgreed?.(agreedAmount);
    } else {
      await base44.entities.Notification.create({
        user_email: targetEmail,
        title: `Offer declined for "${job.title}"`,
        message: `${user.full_name} declined. You can propose a new rate.`,
        type: 'booking_request',
        reference_id: job.id,
        link: `/JobDetail?id=${job.id}`,
        target_role: targetRole,
      });
      queryClient.invalidateQueries({ queryKey: ['job-neg', application.id] });
    }
  };

  if (!canNegotiate && offers.length === 0) return null;

  return (
    <div className="space-y-3 mt-3">
      {offers.length > 0 && (
        <GlassCard className="p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-yellow-400" /> Rate Negotiation
          </h3>
          <div className="space-y-2">
            {[...offers].reverse().map(offer => (
              <div key={offer.id} className={`flex items-start gap-3 text-sm p-2.5 rounded-xl ${
                offer.status === 'accepted' ? 'bg-green-500/10 border border-green-500/20' :
                offer.status === 'declined' ? 'bg-red-500/10 border border-red-500/10' :
                'bg-white/5 border border-white/10'
              }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs capitalize">{offer.offered_by_role === 'client' ? 'Client' : 'Avatar'}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="font-bold text-primary">${offer.amount.toFixed(2)}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      offer.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      offer.status === 'declined' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>{offer.status}</span>
                  </div>
                  {offer.note && <p className="text-xs text-muted-foreground mt-1">"{offer.note}"</p>}
                </div>
              </div>
            ))}
          </div>

          {latestOffer?.status === 'pending' && myTurn && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => respondToOffer(latestOffer.id, true)}>
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept ${latestOffer.amount.toFixed(2)}
              </Button>
              <Button size="sm" variant="outline" className="border-red-500/20 text-red-400 flex-1" onClick={() => respondToOffer(latestOffer.id, false)}>
                <X className="w-3.5 h-3.5 mr-1" /> Decline
              </Button>
            </div>
          )}

          {latestOffer?.status === 'pending' && !myTurn && latestOffer.offered_by_email === user?.email && (
            <p className="text-xs text-muted-foreground text-center pt-1">Waiting for the other party to respond…</p>
          )}
        </GlassCard>
      )}

      {canNegotiate && !showForm && !(latestOffer?.status === 'pending' && !myTurn && latestOffer.offered_by_email === user?.email) && (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/5"
          onClick={() => setShowForm(true)}
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          {latestOffer ? 'Make Counter-Offer' : 'Negotiate Rate'}
        </Button>
      )}

      {showForm && (
        <GlassCard className="p-4 space-y-3 border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" /> Propose Rate
            </p>
            <button onClick={() => { setShowForm(false); setAmount(''); setNote(''); }}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Proposed amount"
              min="1"
              className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optional note..."
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-500/40 text-foreground placeholder:text-muted-foreground resize-none"
          />

          <Button
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            onClick={sendOffer}
            disabled={!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || sending}
          >
            {sending
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</>
              : `Send Offer — $${parseFloat(amount || 0).toFixed(2)}`}
          </Button>
        </GlassCard>
      )}
    </div>
  );
}