import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Clock, MapPin, Check } from 'lucide-react';

const CATEGORIES = [
  'City Guide', 'Property Walkthrough', 'Shopping Help', 'Event Attendance',
  'Queue & Errands', 'Family Support', 'Business Inspection', 'Training & Coaching',
  'Campus Help', 'Travel Assistance', 'Custom Request'
];

export default function CreateBooking() {
  const params = new URLSearchParams(window.location.search);
  const avatarId = params.get('avatar');
  const { user } = useCurrentUser();
  const [submitted, setSubmitted] = useState(false);

  const { data: avatar } = useQuery({
    queryKey: ['booking-avatar', avatarId],
    queryFn: async () => {
      const list = await base44.entities.AvatarProfile.filter({ id: avatarId });
      return list[0] || null;
    },
    enabled: !!avatarId,
  });

  const [form, setForm] = useState({
    category: '', booking_type: 'scheduled', scheduled_date: '', scheduled_time: '',
    duration_minutes: 60, location: '', notes: '', custom_request: '',
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const rate = avatar?.hourly_rate || 30;
  const amount = (rate * form.duration_minutes / 60);
  const serviceFee = Math.round(amount * 0.15 * 100) / 100;
  const total = amount + serviceFee;

  const createBooking = useMutation({
    mutationFn: async () => {
      const booking = await base44.entities.Booking.create({
        client_email: user.email,
        client_name: user.full_name,
        client_type: user.app_role === 'enterprise' ? 'enterprise' : 'user',
        avatar_email: avatar?.user_email || '',
        avatar_name: avatar?.display_name || 'TBD',
        avatar_profile_id: avatarId || '',
        category: form.category,
        service_type: form.category,
        booking_type: form.booking_type,
        scheduled_date: form.scheduled_date,
        scheduled_time: form.scheduled_time,
        duration_minutes: form.duration_minutes,
        location: form.location,
        notes: form.notes,
        custom_request: form.custom_request,
        amount,
        service_fee: serviceFee,
        total_amount: total,
        status: 'pending',
        payment_status: 'pending',
      });
      return booking;
    },
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <GlassCard className="p-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Booking Submitted!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your booking request has been sent to {avatar?.display_name || 'the avatar'}. You'll be notified when they respond.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/Bookings"><Button className="bg-primary hover:bg-primary/90">View Bookings</Button></Link>
            <Link to="/Explore"><Button variant="outline" className="border-white/10">Explore More</Button></Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 px-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Link to={avatarId ? `/AvatarView?id=${avatarId}` : '/Explore'} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="text-2xl font-bold mb-2">Create Booking</h1>
        {avatar && <p className="text-muted-foreground text-sm mb-8">Booking with <span className="text-foreground font-medium">{avatar.display_name}</span> — ${rate}/hr</p>}

        <div className="space-y-6">
          <GlassCard className="p-6 space-y-4">
            <h2 className="font-semibold">Service Details</h2>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Category</label>
              <Select value={form.category} onValueChange={v => update('category', v)}>
                <SelectTrigger className="bg-muted/50 border-white/5"><SelectValue placeholder="Select service type" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type</label>
              <Select value={form.booking_type} onValueChange={v => update('booking_type', v)}>
                <SelectTrigger className="bg-muted/50 border-white/5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate / On-demand</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </GlassCard>

          {form.booking_type === 'scheduled' && (
            <GlassCard className="p-6 space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Schedule</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Date</label>
                  <Input type="date" value={form.scheduled_date} onChange={e => update('scheduled_date', e.target.value)} className="bg-muted/50 border-white/5" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Time</label>
                  <Input type="time" value={form.scheduled_time} onChange={e => update('scheduled_time', e.target.value)} className="bg-muted/50 border-white/5" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Duration</label>
                <Select value={String(form.duration_minutes)} onValueChange={v => update('duration_minutes', parseInt(v))}>
                  <SelectTrigger className="bg-muted/50 border-white/5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </GlassCard>
          )}

          <GlassCard className="p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Location & Details</h2>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Location / Address</label>
              <Input value={form.location} onChange={e => update('location', e.target.value)} placeholder="Where should the avatar go?" className="bg-muted/50 border-white/5" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Notes / Instructions</label>
              <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Any specific instructions..." className="bg-muted/50 border-white/5 h-20" />
            </div>
          </GlassCard>

          {/* Price Summary */}
          <GlassCard className="p-6">
            <h2 className="font-semibold mb-4">Price Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Service ({form.duration_minutes} min × ${rate}/hr)</span><span>${amount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform fee (15%)</span><span>${serviceFee.toFixed(2)}</span></div>
              <div className="border-t border-white/5 pt-2 flex justify-between font-semibold text-base">
                <span>Total</span><span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
          </GlassCard>

          <Button
            className="w-full bg-primary hover:bg-primary/90 py-5 text-base glow-primary-sm"
            onClick={() => createBooking.mutate()}
            disabled={!form.category || createBooking.isPending}
          >
            {createBooking.isPending ? 'Submitting...' : `Confirm Booking — $${total.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}