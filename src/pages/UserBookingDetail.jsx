import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, MapPin, User, DollarSign, MessageSquare, Video, VideoOff, CreditCard, CheckCircle, Loader2, Camera, Wifi, Truck, Wrench } from 'lucide-react';
import LeaveReview from '@/components/reviews/LeaveReview';
import CounterOfferFlow from '@/components/bookings/CounterOfferFlow';

export default function UserBookingDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const paymentResult = params.get('payment');
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [convId, setConvId] = useState(null);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['user-booking', id],
    queryFn: async () => {
      const list = await base44.entities.Booking.filter({ id });
      return list[0] || null;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (!booking) return;
    const ensureConv = async () => {
      try {
        const res = await base44.functions.invoke('createConversation', { bookingId: booking.id });
        if (res.data?.conversation?.id) setConvId(res.data.conversation.id);
      } catch (e) {}
    };
    ensureConv();
  }, [booking?.id]);

  const { data: liveSession } = useQuery({
    queryKey: ['user-booking-live', id],
    queryFn: async () => {
      const list = await base44.entities.LiveSession.filter({ booking_id: id });
      return list.find(s => ['live', 'waiting'].includes(s.status)) || null;
    },
    enabled: !!id,
    refetchInterval: 10000,
  });

  const updateStatus = useMutation({
    mutationFn: (status) => base44.entities.Booking.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-booking', id] }),
  });

  const handlePay = async () => {
    if (!booking) return;
    if (window.self !== window.top) {
      alert('Payment checkout only works on the published app.');
      return;
    }
    setCheckoutLoading(true);
    const res = await base44.functions.invoke('createCheckout', {
      bookingId: booking.id,
      amount: booking.total_amount || booking.amount,
      avatarName: booking.avatar_name,
      category: booking.category,
    });
    if (res.data?.url) {
      window.location.href = res.data.url;
    } else {
      setCheckoutLoading(false);
    }
  };

  const isClient = !!user && !!booking && user.email === booking?.client_email;
  const { data: existingReview } = useQuery({
    queryKey: ['user-booking-review', id, user?.email],
    queryFn: async () => {
      const list = await base44.entities.Review.filter({ booking_id: id, reviewer_email: user?.email });
      return list[0] || null;
    },
    enabled: !!id && isClient && booking?.status === 'completed',
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassCard className="p-8 text-center">
        <p className="text-muted-foreground">Booking not found</p>
      </GlassCard>
    </div>
  );

  const canCancel = isClient && ['pending', 'accepted', 'scheduled'].includes(booking.status);
  const needsPayment = isClient && booking.payment_status === 'pending' && ['pending', 'accepted'].includes(booking.status);

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {paymentResult === 'success' && (
          <div className="mb-6 flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">Payment successful! Your booking is confirmed.</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Booking Details</h1>
          <StatusBadge status={booking.status} />
        </div>

        <div className="space-y-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{booking.category}</h2>
              {booking.stream_mode === 'live_camera' ? (
                <span className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                  <Video className="w-3 h-3" /> Live Camera
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground border border-white/10 px-2.5 py-1 rounded-full">
                  <VideoOff className="w-3 h-3" /> No Camera
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <div>
                  <p className="text-xs text-muted-foreground">Avatar</p>
                  <p className="text-foreground font-medium">{booking.avatar_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-foreground font-medium">{booking.scheduled_date || 'Immediate'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-foreground font-medium">{booking.duration_minutes || 60} min</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-foreground font-medium">{booking.location || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </GlassCard>

          {(booking.notes || booking.transport_required || (booking.equipment_needed || []).length > 0 || booking.service_location_type || booking.meeting_platform) && (
            <GlassCard className="p-6 space-y-3">
              {booking.service_location_type === 'remote' ? (
                <div>
                  <h3 className="font-semibold mb-1 text-sm flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5 text-primary" /> Remote Session</h3>
                  {booking.meeting_platform && <p className="text-sm text-muted-foreground">Platform: <span className="text-foreground font-medium">{booking.meeting_platform}</span></p>}
                </div>
              ) : booking.location ? (
                <div>
                  <h3 className="font-semibold mb-1 text-sm flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> On-site Location</h3>
                  <p className="text-sm text-muted-foreground">{booking.location}</p>
                </div>
              ) : null}
              {booking.notes && (
                <div>
                  <h3 className="font-semibold mb-1">Instructions</h3>
                  <p className="text-sm text-muted-foreground">{booking.notes}</p>
                </div>
              )}
              {booking.transport_required && (
                <div>
                  <h3 className="font-semibold mb-1 text-sm flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-primary" /> Transport Required</h3>
                  {booking.transport_notes && <p className="text-sm text-muted-foreground">{booking.transport_notes}</p>}
                </div>
              )}
              {(booking.equipment_needed || []).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5 text-primary" /> Equipment / Tools Needed</h3>
                  <div className="flex flex-wrap gap-2">
                    {booking.equipment_needed.map((eq, i) => (
                      <span key={i} className="bg-white/5 border border-white/10 text-xs px-3 py-1 rounded-full">{eq}</span>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          )}

          <GlassCard className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span>${booking.amount?.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform fee</span><span>${booking.service_fee?.toFixed(2)}</span></div>
              <div className="border-t border-white/5 pt-2 flex justify-between font-semibold">
                <span>Total</span><span className="text-primary">${booking.total_amount?.toFixed(2)}</span>
              </div>
              <div className="pt-1"><StatusBadge status={booking.payment_status} /></div>
            </div>
          </GlassCard>

          {liveSession && (
            <GlassCard className="p-5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    {liveSession.status === 'live' ? 'Session is LIVE' : 'Avatar is getting ready'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{liveSession.title || liveSession.category}</p>
                </div>
                <Link to={`/ClientLiveView?session=${liveSession.id}`}>
                  <Button size="sm" className="bg-primary gap-2">
                    <Video className="w-3.5 h-3.5" /> Join Stream
                  </Button>
                </Link>
              </div>
            </GlassCard>
          )}

          {booking.proof_url && (
            <GlassCard className="p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Camera className="w-4 h-4 text-primary" /> Job Completion Proof</h3>
              <img src={booking.proof_url} alt="Job proof" className="w-full max-h-64 object-cover rounded-xl border border-white/10 mb-2" />
              {booking.proof_note && <p className="text-xs text-muted-foreground">"{booking.proof_note}"</p>}
            </GlassCard>
          )}

          <CounterOfferFlow
            booking={booking}
            user={user}
            convId={convId}
            onBookingUpdate={() => queryClient.invalidateQueries({ queryKey: ['user-booking', id] })}
          />

          <div className="flex flex-wrap gap-3">
            {canCancel && <Button variant="outline" className="border-white/10 flex-1" onClick={() => updateStatus.mutate('cancelled')}>Cancel Booking</Button>}

            {needsPayment && (
              <Button
                className="w-full bg-primary hover:bg-primary/90 gap-2"
                onClick={handlePay}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</> : <><CreditCard className="w-4 h-4" /> Pay Now — ${booking.total_amount?.toFixed(2)}</>}
              </Button>
            )}

            <Link to={convId ? `/Messages?conv=${convId}` : '/Messages'} className="flex-1">
              <Button variant="outline" className="w-full border-white/10 gap-2">
                <MessageSquare className="w-4 h-4" /> Message
              </Button>
            </Link>
          </div>
        </div>

        {isClient && booking.status === 'completed' && !existingReview && (
          <LeaveReview booking={booking} user={user} />
        )}
        {isClient && booking.status === 'completed' && existingReview && (
          <GlassCard className="p-5 border-yellow-500/20 mt-4">
            <div className="flex items-center gap-2 mb-2">
              {[1,2,3,4,5].map(i => (
                <svg key={i} className={`w-4 h-4 ${i <= existingReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ))}
              <span className="text-xs text-muted-foreground ml-1">Your review</span>
            </div>
            {existingReview.comment && <p className="text-sm text-muted-foreground">"{existingReview.comment}"</p>}
          </GlassCard>
        )}
      </div>
    </div>
  );
}