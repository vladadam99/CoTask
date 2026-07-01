import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, MapPin, User, DollarSign, MessageSquare, Video, VideoOff, Camera, Wifi, Truck, Wrench } from 'lucide-react';
import CounterOfferFlow from '@/components/bookings/CounterOfferFlow';
import ProofUpload from '@/components/bookings/ProofUpload';
import JobApprovalFlow from '@/components/bookings/JobApprovalFlow';

export default function AvatarBookingDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [convId, setConvId] = useState(null);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['avatar-booking', id],
    queryFn: async () => {
      return await base44.entities.Booking.get(id);
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
    queryKey: ['avatar-booking-live', id],
    queryFn: async () => {
      const list = await base44.entities.LiveSession.filter({ booking_id: id });
      return list.find(s => ['live', 'waiting'].includes(s.status)) || null;
    },
    enabled: !!id,
    refetchInterval: 10000,
  });

  const updateStatus = useMutation({
    mutationFn: async (status) => {
      const res = await base44.functions.invoke('updateBookingStatus', { id, status });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['avatar-booking', id] }),
  });

  if (isLoading) return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
  );

  if (!booking) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassCard className="p-8 max-w-md w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <span className="text-primary text-2xl">🔍</span>
        </div>
        <h2 className="text-xl font-bold">Task not found</h2>
        <p className="text-sm text-muted-foreground">
          This Direct Hire request may have been removed, or you don't have permission to view it.
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Button className="w-full" onClick={() => navigate('/AvatarRequests')}>
            Back to My Schedule
          </Button>
          <Button variant="outline" className="w-full border-border" onClick={() => navigate('/JobMarketplace')}>
            Browse Open Tasks
          </Button>
        </div>
      </GlassCard>
    </div>
  );

  const canAccept = booking.status === 'pending';
  const canDecline = booking.status === 'pending';
  const canStart = ['accepted', 'scheduled'].includes(booking.status) && booking.payment_status === 'held' && booking.stream_mode === 'live_camera';
  const canComplete = ['scheduled', 'in_progress'].includes(booking.status) && booking.payment_status === 'held' && !booking.proof_url;
  const canUploadProof = ['scheduled', 'in_progress'].includes(booking.status) && booking.payment_status === 'held' && !booking.proof_url;
  const nextAction = canAccept
    ? {
        title: 'Review Direct Hire Request',
        description: 'Check the task details, propose a different amount if needed, or accept when you are ready.',
        cta: <Button size="sm" onClick={() => updateStatus.mutate('accepted')}>Accept Request</Button>,
      }
    : booking.status === 'accepted' && booking.payment_status === 'pending'
      ? {
          title: 'Waiting for Secure Payment',
          description: 'You accepted the task. The client needs to fund Secure Payment before you start.',
          cta: convId ? <Link to={`/AvatarMessages?conv=${convId}`}><Button variant="outline" size="sm"><MessageSquare className="w-4 h-4" /> Open Messages</Button></Link> : null,
        }
      : canStart
        ? {
            title: 'Ready to Go Live',
            description: 'Secure Payment is held. Start the live session when you are ready.',
            cta: <Button size="sm" variant="live" onClick={() => navigate(`/LiveStreamStudio?booking=${booking.id}`)}><Video className="w-4 h-4" /> Start Live Session</Button>,
          }
        : canUploadProof
          ? {
              title: 'Submit Proof',
              description: 'Upload completion proof so the client can review and approve the task.',
              cta: null,
            }
          : booking.status === 'awaiting_approval'
            ? {
                title: 'Waiting for Client Review',
                description: 'Your proof has been submitted. Secure Payment stays held while the client reviews.',
                cta: null,
              }
            : {
                title: 'Task Status',
                description: 'Coordinate details in messages and follow the latest task state here.',
                cta: convId ? <Link to={`/AvatarMessages?conv=${convId}`}><Button variant="outline" size="sm"><MessageSquare className="w-4 h-4" /> Open Messages</Button></Link> : null,
              };

  return (
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
      <div className="bg-background min-h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Requests
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Task Details</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground border border-border">Direct Hire Request</span>
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {booking.status === 'accepted' && booking.payment_status === 'pending' && (
          <div className="mb-6 flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl px-4 py-3">
            <div className="w-5 h-5 shrink-0 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium">Waiting for client to fund Secure Payment</p>
              <p className="text-xs opacity-90">You have accepted the request. The client has been notified to confirm with payment.</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <GlassCard className="p-5 border-primary/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="section-label">Next action</p>
                  <h2 className="text-lg font-bold text-foreground">{nextAction.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{nextAction.description}</p>
                </div>
              </div>
              {nextAction.cta && <div className="shrink-0">{nextAction.cta}</div>}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{booking.category}</h2>
              {booking.stream_mode === 'live_camera' ? (
                <span className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                  <Video className="w-3 h-3" /> Live Camera
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground border border-border px-2.5 py-1 rounded-full">
                  <VideoOff className="w-3 h-3" /> No Camera
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="text-foreground font-medium">{booking.client_name}</p>
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
                  <h3 className="font-semibold mb-1">Client Instructions</h3>
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
                  <h3 className="font-semibold mb-2 text-sm flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5 text-primary" /> Equipment Needed</h3>
                  <div className="flex flex-wrap gap-2">
                    {booking.equipment_needed.map((eq, i) => (
                      <span key={i} className="bg-secondary/60 border border-border text-xs px-3 py-1 rounded-full">{eq}</span>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          )}

          <GlassCard className="p-6 border-slate-200">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Your Earnings</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Service rate</span><span>${booking.amount?.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform fee (10%)</span><span className="text-red-400">-${booking.service_fee?.toFixed(2)}</span></div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>You receive</span><span className="text-green-400">${(booking.amount - booking.service_fee || 0).toFixed(2)}</span>
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
                    {liveSession.status === 'live' ? 'Session is LIVE' : 'Session starting…'}
                  </p>
                </div>
                <Button size="sm" className="bg-primary gap-2" onClick={() => navigate(`/LiveStreamStudio?booking=${booking.id}`)}>
                  <Video className="w-3.5 h-3.5" /> Start Live Session
                </Button>
              </div>
            </GlassCard>
          )}

          {booking.proof_url && (
            <GlassCard className="p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Camera className="w-4 h-4 text-primary" /> Proof Submitted</h3>
              <img src={booking.proof_url} alt="Task proof" className="w-full max-h-64 object-cover rounded-xl border border-border mb-2" />
              {booking.proof_note && <p className="text-xs text-muted-foreground">"{booking.proof_note}"</p>}
            </GlassCard>
          )}

          {canUploadProof && (
            <ProofUpload booking={booking} onUpload={() => queryClient.invalidateQueries({ queryKey: ['avatar-booking', id] })} />
          )}

          <JobApprovalFlow booking={booking} user={user} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['avatar-booking', id] })} />

          <CounterOfferFlow
            booking={booking}
            user={user}
            convId={convId}
            role="avatar"
            onBookingUpdate={() => queryClient.invalidateQueries({ queryKey: ['avatar-booking', id] })}
          />

          <div className="flex flex-col gap-3 pb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              {canAccept && (
                <Button className="flex-1 h-12 text-base" onClick={() => updateStatus.mutate('accepted')}>
                  Accept Request
                </Button>
              )}
              {canStart && (
                <Button variant="live" className="flex-1 h-12 text-base" onClick={() => navigate(`/LiveStreamStudio?booking=${booking.id}`)}>
                  Start Live Session
                </Button>
              )}
              {canComplete && (
                <Button className="bg-green-600 hover:bg-green-700 flex-1 h-12 text-base shadow-lg shadow-green-500/20" onClick={() => updateStatus.mutate('completed')}>
                  Mark Ready for Review
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
              {convId && (
                <Link to={`/AvatarMessages?conv=${convId}`} className="flex-1 min-w-[140px]">
                  <Button variant="outline" className="w-full border-border gap-2">
                    <MessageSquare className="w-4 h-4" /> Open Messages
                  </Button>
                </Link>
              )}
              {canDecline && (
                <Button variant="ghost" className="text-muted-foreground hover:text-destructive flex-1 min-w-[140px]" onClick={() => updateStatus.mutate('declined')}>
                  Decline Request
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </AppShell>
  );
}
