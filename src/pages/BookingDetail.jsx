import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, MapPin, User, DollarSign, MessageSquare } from 'lucide-react';

export default function BookingDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const list = await base44.entities.Booking.filter({ id });
      return list[0] || null;
    },
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: (status) => base44.entities.Booking.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['booking', id] }),
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (!booking) return <div className="min-h-screen flex items-center justify-center"><GlassCard className="p-8 text-center"><p className="text-muted-foreground">Booking not found</p></GlassCard></div>;

  const isAvatar = user?.email === booking.avatar_email;
  const canAccept = isAvatar && booking.status === 'pending';
  const canDecline = isAvatar && booking.status === 'pending';
  const canStart = isAvatar && ['accepted', 'scheduled'].includes(booking.status);
  const canComplete = isAvatar && booking.status === 'in_progress';
  const canCancel = !isAvatar && ['pending', 'accepted', 'scheduled'].includes(booking.status);

  return (
    <div className="min-h-screen pb-12 px-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Link to="/Bookings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Bookings
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Booking Details</h1>
          <StatusBadge status={booking.status} />
        </div>

        <div className="space-y-4">
          <GlassCard className="p-6">
            <h2 className="font-semibold text-lg mb-4">{booking.category}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <div>
                  <p className="text-xs text-muted-foreground">{isAvatar ? 'Client' : 'Avatar'}</p>
                  <p className="text-foreground font-medium">{isAvatar ? booking.client_name : booking.avatar_name}</p>
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

          {booking.notes && (
            <GlassCard className="p-6">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{booking.notes}</p>
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
              <StatusBadge status={booking.payment_status} />
            </div>
          </GlassCard>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {canAccept && <Button className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => updateStatus.mutate('accepted')}>Accept</Button>}
            {canDecline && <Button variant="outline" className="border-red-500/20 text-red-400 flex-1" onClick={() => updateStatus.mutate('declined')}>Decline</Button>}
            {canStart && <Button className="bg-primary hover:bg-primary/90 flex-1" onClick={() => updateStatus.mutate('in_progress')}>Start Session</Button>}
            {canComplete && <Button className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => updateStatus.mutate('completed')}>Mark Complete</Button>}
            {canCancel && <Button variant="outline" className="border-white/10 flex-1" onClick={() => updateStatus.mutate('cancelled')}>Cancel Booking</Button>}
            <Link to="/Messages" className="flex-1">
              <Button variant="outline" className="w-full border-white/10"><MessageSquare className="w-4 h-4 mr-2" /> Message</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}