import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import { EmptyState, PageHero } from '@/components/ui/PagePrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Wrench, Plus, X, Sparkles, Loader2, Video, VideoOff, Truck, Search } from 'lucide-react';
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
  const queryClient = useQueryClient();
  const activeRole = user?.selected_role || user?.role || 'user';
  const shellRole = activeRole === 'avatar' ? 'user' : activeRole;
  const shellHomePath = shellRole === 'user' ? '/Explore' : undefined;
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');

  const [step, setStep] = useState('form');
  const [newEquipment, setNewEquipment] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);

  const { data: avatar } = useQuery({
    queryKey: ['booking-avatar', avatarId],
    queryFn: () => base44.entities.AvatarProfile.get(avatarId),
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
      // silently fail ? user can fill manually
    } finally {
      setAiLoading(false);
    }
  };

  const handleReview = () => {
    if (!user) { setError('Please sign in before sending a request.'); return; }
    if (!avatarId || !avatar) { setError('Please choose a Local Agent before sending a Direct Hire request.'); return; }
    if (!form.category) { setError("Please select a category."); return; }
    if (form.booking_type === "scheduled" && !form.scheduled_date) { setError("Please select a date."); return; }
    if (form.booking_type === "scheduled" && !form.scheduled_time) { setError("Please select a time."); return; }
    setError('');
    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const createAndPay = async () => {
    if (!user) {
      setError('Please sign in before sending a request.');
      return;
    }
    if (!avatarId || !avatar) {
      setError('Please choose a Local Agent before sending a Direct Hire request.');
      return;
    }
    if (!form.category) {
      setError('Please select a category.');
      return;
    }
    if (form.booking_type === 'scheduled' && (!form.scheduled_date || !form.scheduled_time)) {
      setError('Please select a date and time.');
      return;
    }
    setError('');
    setCheckoutLoading(true);
    try {
      const bookingRes = await base44.functions.invoke('createBooking', {
        client_type: (user.selected_role || user.role) === 'enterprise' ? 'enterprise' : 'user',
        avatar_profile_id: avatarId || '',
        avatar_email: avatar?.user_email || '',
        avatar_name: avatar?.display_name || '',
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
        live_premium: livePremium,
        amount: amount,
        service_fee: serviceFee,
        total_amount: total,
        payment_status: 'pending',
      });

      if (!bookingRes.data.success) throw new Error(bookingRes.data.error || 'Failed to create booking');
      const booking = bookingRes.data.booking;

      base44.functions.invoke('createConversation', { bookingId: booking.id }).catch(() => {});

      // Cache the booking so the detail page renders instantly without waiting for read replicas
      queryClient.setQueryData(['user-booking', booking.id], booking);

      // Decoupled payment - redirect to detail page to await agent acceptance
      navigate(`/UserBookingDetail?id=${booking.id}&new=true`);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setCheckoutLoading(false);
    }
  };

  if (!avatarId) {
    return (
      <AppShell navItems={getNavItems(shellRole)} user={user} roleOverride={shellRole} homePathOverride={shellHomePath}>
        <EmptyState
          icon={Search}
          title="Choose a Local Agent first"
          description="Direct Hire requests must be connected to a specific Local Agent. Choose who you want to request, or post an open task for proposals."
          action={(
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => navigate('/Explore')}>Discover Local Agents</Button>
              <Button variant="outline" className="border-border" onClick={() => navigate('/PostJob')}>New Brief</Button>
            </div>
          )}
        />
      </AppShell>
    );
  }
  if (step === 'review') {
    return (
      <AppShell navItems={getNavItems(shellRole)} user={user} roleOverride={shellRole} homePathOverride={shellHomePath}>
        <div className="max-w-2xl mx-auto pt-8 pb-12">
          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">{error}</p>}
          <ReviewBookingPanel
            form={form} avatar={avatar} amount={amount} livePremium={livePremium}
            serviceFee={serviceFee} total={total}
            loading={checkoutLoading} onBack={() => setStep('form')} onConfirm={createAndPay}
          />
        </div>
        </AppShell>
    );
  }

  return (
    <AppShell navItems={getNavItems(shellRole)} user={user} roleOverride={shellRole} homePathOverride={shellHomePath}>
      <div className="mx-auto max-w-5xl space-y-6 pb-12">
        <PageHero
          eyebrow="Direct hire"
          title="Request Direct Hire"
          description="Send a focused task request to this Local Agent. They can accept, decline, or discuss details before the payment handoff."
          icon={Sparkles}
          actions={(
            <Button variant="secondary" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}
        />

        <div className="surface-panel rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Tip:</strong> Direct Hire is best when you already selected a Local Agent. If you want multiple proposals, <a href="/PostJob" className="text-primary hover:underline">create a brief</a> instead.
          </p>
        </div>

        {avatar && (
          <div className="flex items-center gap-3 mb-8">
            {avatar.photo_url
              ? <img src={avatar.photo_url} className="w-9 h-9 rounded-full object-cover border border-border" alt={avatar.display_name} />
              : <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">{avatar.display_name?.[0]}</div>
            }
            <p className="text-muted-foreground text-sm">with <span className="text-foreground font-medium">{avatar.display_name}</span> ? ${rate}/hr</p>
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-5">

          {/* AI Autofill */}
          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Describe your task (optional)</h2>
            </div>
            <Textarea
              value={aiDescription}
              onChange={e => setAiDescription(e.target.value)}
              placeholder="e.g. I need someone to pick up my dry cleaning from the shop on Oxford Street and drop it at my flat?"
              className="bg-card border-border h-20 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full border-primary/30 text-primary hover:bg-primary/10 gap-2 text-sm"
              onClick={handleAiAutofill}
              disabled={aiLoading || !aiDescription.trim()}
            >
              {aiLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Filling in details...</> : <><Sparkles className="w-3.5 h-3.5" /> Autofill with AI</>}
            </Button>
            {aiUsed && <p className="text-xs text-primary/70">AI filled in the details below - review and adjust as needed.</p>}
          </GlassCard>

          {/* Camera */}
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold text-sm">Live camera stream?</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'no_camera', label: 'No Camera', sub: 'Updates via messages', icon: VideoOff, tooltip: 'Task is completed without streaming video.' },
                { value: 'live_camera', label: 'Live Camera', sub: `+$${LIVE_PREMIUM_PER_HOUR}/hr premium`, icon: Video, tooltip: 'Watch a live video feed from the Local Agent during the task.' },
              ].map(opt => {
                const Icon = opt.icon;
                return (
                  <button key={opt.value} type="button" onClick={() => update('stream_mode', opt.value)} title={opt.tooltip}
                    className={`p-4 rounded-xl border text-left transition-all ${form.stream_mode === opt.value ? 'bg-primary/10 border-primary/40' : 'bg-card border-border hover:border-primary/30'}`}>
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
              <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Select service type" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.notes ? (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Task description</label>
                <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="bg-card border-border h-20 text-sm" placeholder="Describe the task in detail..." />
              </div>
            ) : (
              <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="bg-card border-border h-20 text-sm" placeholder="Any specific instructions for the agent..." />
            )}
          </GlassCard>

          {/* Booking Type */}
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold text-sm">When do you need this?</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'immediate', label: 'Right Now', sub: 'On-demand, ASAP' },
                { value: 'scheduled', label: 'Schedule', sub: 'Pick a date & time' },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => update('booking_type', opt.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${form.booking_type === opt.value ? 'bg-primary/10 border-primary/40' : 'bg-card border-border hover:border-border'}`}>
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
                    <Input type="date" value={form.scheduled_date} onChange={e => update('scheduled_date', e.target.value)} className="bg-card border-border text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Time</label>
                    <Input type="time" value={form.scheduled_time} onChange={e => update('scheduled_time', e.target.value)} className="bg-card border-border text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="number"
                        min="0"
                        value={Math.floor(form.duration_minutes / 60).toString()}
                        onChange={e => update('duration_minutes', (parseInt(e.target.value) || 0) * 60 + (form.duration_minutes % 60))}
                        className="bg-card border-border text-sm"
                      />
                      <span className="text-sm text-muted-foreground">hrs</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={(form.duration_minutes % 60).toString()}
                        onChange={e => update('duration_minutes', Math.floor(form.duration_minutes / 60) * 60 + (parseInt(e.target.value) || 0))}
                        className="bg-card border-border text-sm"
                      />
                      <span className="text-sm text-muted-foreground">mins</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Travel */}
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold text-sm flex items-center gap-2"><Truck className="w-4 h-4 text-primary" /> Does the agent need to travel?</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: false, label: 'No Travel', sub: 'Remote or already on location' },
                { value: true, label: 'Travel Needed', sub: 'Agent needs to go somewhere' },
              ].map(opt => (
                <button key={String(opt.value)} type="button" onClick={() => update('transport_required', opt.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${form.transport_required === opt.value ? 'bg-primary/10 border-primary/40' : 'bg-card border-border hover:border-border'}`}>
                  <p className={`font-medium text-sm ${form.transport_required === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.sub}</p>
                </button>
              ))}
            </div>
            {form.transport_required && (
              <Input value={form.transport_notes} onChange={e => update('transport_notes', e.target.value)}
                placeholder="e.g. Uber provided, public transport from Zone 1..."
                className="bg-card border-border text-sm" />
            )}
            {form.transport_required && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Location / Address</label>
                <Input value={form.location} onChange={e => update('location', e.target.value)}
                  placeholder="e.g. 12 Baker St, London W1U 3BW"
                  className="bg-card border-border text-sm" />
              </div>
            )}
          </GlassCard>

          {/* Equipment */}
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold text-sm flex items-center gap-2"><Wrench className="w-4 h-4 text-primary" /> Equipment needed?</h2>
            <div className="flex gap-2">
              <Input value={newEquipment} onChange={e => setNewEquipment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newEquipment.trim()) { e.preventDefault(); update('equipment_needed', [...form.equipment_needed, newEquipment.trim()]); setNewEquipment(''); } }}
                placeholder="e.g. smartphone, ladder, drill..."
                className="bg-card border-border text-sm" />
              <Button type="button" variant="outline" className="border-border shrink-0"
                onClick={() => { if (newEquipment.trim()) { update('equipment_needed', [...form.equipment_needed, newEquipment.trim()]); setNewEquipment(''); } }}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {form.equipment_needed.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.equipment_needed.map((eq, i) => (
                  <span key={i} className="flex items-center gap-1.5 bg-secondary/60 border border-border text-sm px-3 py-1 rounded-full">
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
              <div className="flex justify-between text-muted-foreground"><span>Service ({form.duration_minutes} min ? ${rate}/hr)</span><span className="text-foreground">${(amount - livePremium).toFixed(2)}</span></div>
              {livePremium > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Live camera premium</span><span className="text-primary">+${livePremium.toFixed(2)}</span></div>}
              <div className="flex justify-between text-muted-foreground"><span>Platform fee (15%)</span><span className="text-foreground">${serviceFee.toFixed(2)}</span></div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">${total.toFixed(2)}</span></div>
            </div>
          </GlassCard>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

          <Button className="w-full py-5 text-base gap-2 bg-primary hover:bg-primary/90" onClick={handleReview} disabled={!form.category}>
            Review Request
          </Button>
          <p className="text-xs text-center text-muted-foreground pb-4">You'll review all details before secure payment.</p>
        </div>
      </div>
    </AppShell>
  );
}

