import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import { AlertTriangle, Loader2, CheckCircle, X, DollarSign, ArrowRight } from 'lucide-react';

export default function CounterOfferFlow({ booking, user, convId, onBookingUpdate }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const isAvatar = user?.email === booking?.avatar_email;
  const isClient = user?.email === booking?.client_email;

  const { data: offers = [] } = useQuery({
    queryKey: ['counter-offers', booking?.id],
    queryFn: () => base44.entities.CounterOffer.filter({ booking_id: booking.id }, '-created_date', 20),
    enabled: !!booking?.id,
    refetchInterval: 5000,
  });

  const latestOffer = offers[0];
  const myTurn = latestOffer
    ? (latestOffer.status === 'pending' &&
       ((isAvatar && latestOffer.offered_by_role === 'client') ||
        (isClient && latestOffer.offered_by_role === 'avatar')))
    : (isAvatar && booking?.status === 'pending'); // Avatar can start first challenge

  const canChallenge = booking?.status === 'pending' &&
    (!latestOffer || latestOffer.status !== 'pending' || myTurn);

  const sendOffer = async () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    setSending(true);

    const newOffer = await base44.entities.CounterOffer.create({
      booking_id: booking.id,
      offered_by_email: user.email,
      offered_by_name: user.full_name,
      offered_by_role: isAvatar ? 'avatar' : 'client',
      amount: parseFloat(amount),
      note: note.trim(),
      status: 'pending',
    });

    // Notify the other party
    const targetEmail = isAvatar ? booking.client_email : booking.avatar_email;
    const targetRole = isAvatar ? 'user' : 'avatar';
    await base44.entities.Notification.create({
      user_email: targetEmail,
      title: `${user.full_name} made a counter-offer`,
      message: `New amount: $${parseFloat(amount).toFixed(2)}${note ? ` — "${note}"` : ''}`,
      type: 'booking_request',
      reference_id: booking.id,
      link: isAvatar ? `/UserBookingDetail?id=${booking.id}` : `/AvatarBookingDetail?id=${booking.id}`,
      target_role: targetRole,
    });

    if (convId) {
      await base44.entities.Message.create({
        conversation_id: convId,
        sender_email: user.email,
        sender_name: user.full_name,
        content: `💬 Counter-offer: $${parseFloat(amount).toFixed(2)}${note ? ` — ${note}` : ''}`,
        message_type: 'system',
      });
    }

    setAmount('');
    setNote('');
    setShowForm(false);
    setSending(false);
    queryClient.invalidateQueries({ queryKey: ['counter-offers', booking.id] });
  };

  const respondToOffer = async (offerId, accept) => {
    await base44.entities.CounterOffer.update(offerId, { status: accept ? 'accepted' : 'declined' });

    if (accept && latestOffer) {
      // Update booking amount
      const newAmount = latestOffer.amount;
      const fee = parseFloat((newAmount * 0.15).toFixed(2));
      await base44.entities.Booking.update(booking.id, {
        amount: newAmount,
        service_fee: fee,
        total_amount: parseFloat((newAmount + fee).toFixed(2)),
      });

      // Notify
      const targetEmail = isAvatar ? booking.client_email : booking.avatar_email;
      const targetRole = isAvatar ? 'user' : 'avatar';
      await base44.entities.Notification.create({
        user_email: targetEmail,
        title: 'Counter-offer accepted!',
        message: `${user.full_name} accepted the offer of $${newAmount.toFixed(2)}`,
        type: 'payment',
        reference_id: booking.id,
        link: isAvatar ? `/UserBookingDetail?id=${booking.id}` : `/AvatarBookingDetail?id=${booking.id}`,
        target_role: targetRole,
      });

      onBookingUpdate?.();
    } else if (!accept && latestOffer) {
      const targetEmail = isAvatar ? booking.client_email : booking.avatar_email;
      const targetRole = isAvatar ? 'user' : 'avatar';
      await base44.entities.Notification.create({
        user_email: targetEmail,
        title: 'Counter-offer declined',
        message: `${user.full_name} declined the offer. You can make a new offer.`,
        type: 'booking_request',
        reference_id: booking.id,
        link: isAvatar ? `/UserBookingDetail?id=${booking.id}` : `/AvatarBookingDetail?id=${booking.id}`,
        target_role: targetRole,
      });
    }

    queryClient.invalidateQueries({ queryKey: ['counter-offers', booking.id] });
    queryClient.invalidateQueries({ queryKey: ['booking', booking.id] });
  };

  if (booking?.status !== 'pending') return null;

  return (
    <div className="space-y-3">
      {/* Offer history */}
      {offers.length > 0 && (
        <GlassCard className="p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-yellow-400" /> Negotiation History
          </h3>
          <div className="space-y-2">
            {[...offers].reverse().map((offer, i) => (
              <div key={offer.id} className={`flex items-start gap-3 text-sm p-2.5 rounded-xl ${
                offer.status === 'accepted' ? 'bg-green-500/10 border border-green-500/20' :
                offer.status === 'declined' ? 'bg-red-500/10 border border-red-500/10' :
                'bg-white/5 border border-white/10'
              }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs capitalize">{offer.offered_by_role}</span>
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

          {/* Respond to latest pending offer */}
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
        </GlassCard>
      )}

      {/* Challenge button */}
      {canChallenge && !showForm && !(latestOffer?.status === 'pending' && myTurn) && (
        <Button
          variant="outline"
          className="w-full border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/5"
          onClick={() => setShowForm(true)}
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          {latestOffer ? 'Make Counter-Offer' : 'Challenge Offer'}
        </Button>
      )}

      {/* Counter offer form */}
      {showForm && (
        <GlassCard className="p-4 space-y-3 border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              {isAvatar ? 'Propose Different Amount' : 'Counter-Offer'}
            </p>
            <button onClick={() => { setShowForm(false); setAmount(''); setNote(''); }}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            {isAvatar
              ? 'Propose a new price (e.g. due to travel, equipment, time required)'
              : 'Suggest a different price for this booking'}
          </p>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount (e.g. 45)"
              min="1"
              className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={isAvatar
              ? 'Reason: e.g. Travel to location requires 2h, need $15 travel fee'
              : 'Optional note to the avatar...'}
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