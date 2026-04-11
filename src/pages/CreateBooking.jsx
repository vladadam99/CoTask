import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Wrench, Plus, X, FlaskConical, Sparkles, Loader2, Video, VideoOff, Truck, CreditCard } from 'lucide-react';
import ReviewBookingPanel from '@/components/bookings/ReviewBookingPanel';

const CATEGORIES = [
  'City Guide', 'Property Walkthrough', 'Shopping Help', 'Event Attendance',
  'Queue & Errands', 'Family Support', 'Business Inspection', 'Training & Coaching',
  'Campus Help', 'Travel Assistance', 'DIY & Home Help', 'Custom Request'
];

export default function CreateBooking() {
  const params = new URLSearchParams(window.location.search);
  const avatarId = params.get('avatar');
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [freeTest, setFreeTest] = useState(false);
  const [step, setStep] = useState('form');
  const [newEquipment, setNewEquipment] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);

  const { data: avatar } = useQuery({
    queryKey: ['booking-avatar', avatarId],
    queryFn: async () => {
      const list = await base44.entities.AvatarProfile.filter({ id: avatarId });
      return list[0] || null;
    },
    enabled: !!avatarId,
  });

  const [form, setForm] = useState({
    category: '',
    booking_type: 'scheduled',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    stream_mode: 'no_camera',
    transport_required: false,
    transport_notes: '',
    equipment_needed: [],
    notes: '',
    service_location_type: 'onsite',
    location: '',
    meeting_platform: '',
    custom_request: '',
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const LIVE_PREMIUM_PER_HOUR = 5;
  const rate = avatar?.hourly_rate || 30;
  const livePremium = form.stream_mode === 'live_camera' ? (LIVE_PREMIUM_PER_HOUR * form.duration_minutes / 60) : 0;
  const amount = (rate * form.duration_minutes / 60) + livePremium;
  const serviceFee = Math.round(amount * 0.15 * 100) / 100;
  const total = amount + serviceFee;

  const handleAiAutofill = async () => {
    if (!aiDescription.trim()) return;
    setAiLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `A client on CoTask (a human avatar hiring platform) described their task as: "${aiDescription}"

Based on this, return:
- category: best match from [City Guide, Property Walkthrough, Shopping Help, Event Attendance, Queue & Errands, Family Support, Business Inspection, Training & Coaching, Campus Help, Travel Assistance, DIY & Home Help, Custom Request]
- notes: a clear, detailed task description for the avatar (2-4 sentences, practical)
- transport_required: true if the avatar needs to travel somewhere, false if it can be done remotely or at home
- equipment: array of specific tools/devices needed (max 4, be concise, empty array if none)`,
        response_json_schema: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            notes: { type: 'string' },
            transport_required: { type: 'boolean' },
            equipment: { type: 'array', items: { type: 'string' } },
          },
        },
      });
      if (result?.category) update('category', result.category);
      if (result?.notes) update('notes', result.notes);
      if (typeof result?.transport_required === 'boolean') update('transport_required', result.transport_required);
      if (result?.equipment?.length) update('equipment_needed', result.equipment);
      setAiUsed(true);
    } catch (e) {
      // silently fail — user can fill manually
    } finally {
      setAiLoading(false);
    }
  };

  const handleReview = () => {
    if (!form.category) { setError('Please select a category.'); return; }
    if (form.booking_type === 'scheduled' && !form.scheduled_date) { setError('Please select a date.'); return; }
    setError('');
    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const createAndPay = async () => {
    setError('');
    setCheckoutLoading(true);
    try {
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
        service_location_type: form.service_location_type,
        location: form.location,
        notes: form.notes,
        custom_request: form.custom_request,
        stream_mode: form.stream_mode,
        transport_required: form.transport_required,
        transport_notes: form.transport_notes,
        equipment_needed: form.equipment_needed,
        live_premium: freeTest ? 0 : livePremium,
        amount: freeTest ? 0 : amount,
        service_fee: freeTest ? 0 : serviceFee,
        total_amount: freeTest ? 0 : total,
        status: freeTest ? 'accepted' : 'pending',
        payment_status: freeTest ? 'paid' : 'pending',
      });

      base44.functions.invoke('createConversation', { bookingId: booking.id }).catch(() => {});

      // Notify avatar of new booking request
      if (avatar?.user_email) {
        base44.entities.Notification.create({
          user_email: avatar.user_email,
          title: 'New Booking Request!',
          message: `${user.full_name} has requested a ${form.category} booking${form.scheduled_date ? ` on ${form.scheduled_date}` : ''}. Accept or decline in your requests.`,
          type: 'booking_request',
          link: '/AvatarRequests',
          reference_id: booking.id,
        }).catch(() => {});
      }

      if (freeTest) {
        navigate(`/UserBookingDetail?id=${booking.id}`);
        return;
      }

      if (window.self !== window.top) {
        alert('Payment checkout only works on the published app.');
        setCheckoutLoading(false);
        return;
      }

      const res = await base44.functions.invoke('createCheckout', {
        bookingId: booking.id,
        amount: total,
        avatarName: avatar?.display_name,
        category: form.category,
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        throw new Error(res.data?.error || 'Failed to create checkout');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setCheckoutLoading(false);
    }
  };

  if (step === 'review') {
    return (
      <div className="min-h-screen pb-12 px-4">
        <div className="max-w-2xl mx-auto pt-8">
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">{error}</p>}
          <ReviewBookingPanel
            form={form} avatar={avatar} amount={amount} livePremium={livePremium}
            serviceFee={serviceFee} total={total} freeTest={freeTest}
            loading={checkoutLoading} onBack={() => setStep('form')} onConfirm={createAndPay}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 px-4">
      <div className="max-w-xl mx-auto pt-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-bold mb-1">Create Booking</h1>
        {avatar && (
          <div className="flex items-center gap-3 mb-8">
            {avatar.photo_url
              ? <img src={avatar.photo_url} className="w-9 h-9 rounded-full object-cover border border-white/10" alt={avatar.display_name} />
              : <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{avatar.display_name?.[0]}</div>
            }
            <p className="text-muted-foreground text-sm">with <span className="text-foreground font-medium">{avatar.display_name}</span> · ${rate}/hr</p>
          </div>
        )}

        <div className="space-y-5">

          {/* AI Autofill */}
          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Describe your task (optional)</h2>
            </div>
            <Textarea
              value={aiDescription}
              onChange={e => setAiDescription(e.target.value)}
              placeholder="e.g. I need someone to pick up my dry cleaning from the shop on Oxford Street and drop it at my flat…"
              className="bg-muted/50 border-white/5 h-20 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full border-primary/30 text-primary hover:bg-primary/10 gap-2 text-sm"
              onClick={handleAiAutofill}
              disabled={aiLoading || !aiDescription.trim()}
            >
              {aiLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Filling in details…</> : <><Sparkles className="w-3.5 h-3.5" /> Autofill with AI</>}
            </Button>
            {aiUsed && <p className="text-xs text-primary/70">✓ AI filled in the details below — review and adjust as needed.</p>}
          </GlassCard>

          {/* Camera */}
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold text-sm">Live camera stream?</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'no_camera', label: 'No Camera', sub: 'Updates via messages', icon: VideoOff },
                { value: 'live_camera', label: 'Live Camera', sub: `+$${LIVE_PREMIUM_PER_HOUR}/hr premium`, icon: Video },
              ].map(opt => {
                const Icon = opt.icon;
                return (
                  <button key={opt.value} type="button" onClick={() => update('stream_mode', opt.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${form.stream_mode === opt.value ? 'bg-primary/10 border-primary/40' : 'bg-muted/30 border-white/5 hover:border-white/10'}`}>
                    <Icon className={`w-5 h-5 mb-2 ${form.stream_mode === opt.value ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className={`font-medium text-sm ${form.stream_mode === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Category */}
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold text-sm">Category</h2>
            <Select value={form.category} onValueChange={v => update('category', v)}>
              <SelectTrigger className="bg-muted/50 border-white/5"><SelectValue placeholder="Select service type" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.notes ? (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Task description</label>
                <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="bg-muted/50 border-white/5 h-20 text-sm" placeholder="Describe the task in detail…" />
              </div>
            ) : (
              <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="bg-muted/50 border-white/5 h-20 text-sm" placeholder="Any specific instructions for the avatar…" />
            )}
          </GlassCard>

          {/* Booking Type */}
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold text-sm">When do you need this?</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'immediate', label: '⚡ Right Now', sub: 'On-demand, ASAP' },
                { value: 'scheduled', label: '📅 Schedule', sub: 'Pick a date & time' },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => update('booking_type', opt.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${form.booking_type === opt.value ? 'bg-primary/10 border-primary/40' : 'bg-muted/30 border-white/5 hover:border-white/10'}`}>
                  <p className={`font-medium text-sm ${form.booking_type === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                </button>
              ))}
            </div>
            {form.booking_type === 'scheduled' && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                    <Input type="date" value={form.scheduled_date} onChange={e => update('scheduled_date', e.target.value)} className="bg-muted/50 border-white/5 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Time</label>
                    <Input type="time" value={form.scheduled_time} onChange={e => update('scheduled_time', e.target.value)} className="bg-muted/50 border-white/5 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                  <Select value={String(form.duration_minutes)} onValueChange={v => update('duration_minutes', parseInt(v))}>
                    <SelectTrigger className="bg-muted/50 border-white/5 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Travel */}
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold text-sm flex items-center gap-2"><Truck className="w-4 h-4 text-primary" /> Does the avatar need to travel?</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: false, label: '🏠 No Travel', sub: 'Remote or already on location' },
                { value: true, label: '🚗 Yes, Travel', sub: 'Avatar needs to go somewhere' },
              ].map(opt => (
                <button key={String(opt.value)} type="button" onClick={() => update('transport_required', opt.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${form.transport_required === opt.value ? 'bg-primary/10 border-primary/40' : 'bg-muted/30 border-white/5 hover:border-white/10'}`}>
                  <p className={`font-medium text-sm ${form.transport_required === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                </button>
              ))}
            </div>
            {form.transport_required && (
              <Input value={form.transport_notes} onChange={e => update('transport_notes', e.target.value)}
                placeholder="e.g. Uber provided, public transport from Zone 1…"
                className="bg-muted/50 border-white/5 text-sm" />
            )}
            {form.transport_required && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Location / Address</label>
                <Input value={form.location} onChange={e => update('location', e.target.value)}
                  placeholder="e.g. 12 Baker St, London W1U 3BW"
                  className="bg-muted/50 border-white/5 text-sm" />
              </div>
            )}
          </GlassCard>

          {/* Equipment */}
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold text-sm flex items-center gap-2"><Wrench className="w-4 h-4 text-primary" /> Equipment needed?</h2>
            <div className="flex gap-2">
              <Input value={newEquipment} onChange={e => setNewEquipment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newEquipment.trim()) { e.preventDefault(); update('equipment_needed', [...form.equipment_needed, newEquipment.trim()]); setNewEquipment(''); } }}
                placeholder="e.g. smartphone, ladder, drill…"
                className="bg-muted/50 border-white/5 text-sm" />
              <Button type="button" variant="outline" className="border-white/10 shrink-0"
                onClick={() => { if (newEquipment.trim()) { update('equipment_needed', [...form.equipment_needed, newEquipment.trim()]); setNewEquipment(''); } }}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {form.equipment_needed.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.equipment_needed.map((eq, i) => (
                  <span key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-sm px-3 py-1 rounded-full">
                    {eq}
                    <button type="button" onClick={() => update('equipment_needed', form.equipment_needed.filter((_, idx) => idx !== i))}>
                      <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {form.equipment_needed.length === 0 && <p className="text-xs text-muted-foreground">Leave empty if no special equipment is needed.</p>}
          </GlassCard>

          {/* Price */}
          <GlassCard className="p-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Service ({form.duration_minutes} min × ${rate}/hr)</span><span className="text-foreground">${(amount - livePremium).toFixed(2)}</span></div>
              {livePremium > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Live camera premium</span><span className="text-primary">+${livePremium.toFixed(2)}</span></div>}
              <div className="flex justify-between text-muted-foreground"><span>Platform fee (15%)</span><span className="text-foreground">${serviceFee.toFixed(2)}</span></div>
              <div className="border-t border-white/5 pt-2 flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">${total.toFixed(2)}</span></div>
            </div>
          </GlassCard>

          {/* Free test */}
          <button type="button" onClick={() => setFreeTest(v => !v)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm ${freeTest ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-card/40 border-white/5 text-muted-foreground hover:border-white/10'}`}>
            <FlaskConical className="w-4 h-4 shrink-0" />
            <div className="text-left flex-1">
              <p className="font-medium">Free test booking</p>
              <p className="text-xs opacity-70">Skip payment — instantly accepted for testing</p>
            </div>
            <div className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${freeTest ? 'bg-yellow-500' : 'bg-muted'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${freeTest ? 'translate-x-4' : ''}`} />
            </div>
          </button>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

          <Button className="w-full py-5 text-base gap-2 bg-primary hover:bg-primary/90 glow-primary-sm" onClick={handleReview} disabled={!form.category}>
            Review Booking →
          </Button>
          <p className="text-xs text-center text-muted-foreground pb-4">You'll review all details before payment.</p>
        </div>
      </div>
    </div>
  );
}