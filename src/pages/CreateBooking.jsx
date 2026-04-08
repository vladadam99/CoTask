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
import { ArrowLeft, Calendar, MapPin, Wifi, Truck, Wrench, Plus, X, FlaskConical } from 'lucide-react';
import CameraOptionPicker from '@/components/bookings/CameraOptionPicker';
import ReviewBookingPanel from '@/components/bookings/ReviewBookingPanel';

const CATEGORIES = [
  'City Guide', 'Property Walkthrough', 'Shopping Help', 'Event Attendance',
  'Queue & Errands', 'Family Support', 'Business Inspection', 'Training & Coaching',
  'Campus Help', 'Travel Assistance', 'DIY & Home Help', 'Custom Request'
];

const CATEGORY_PROMPTS = {
  'City Guide': 'e.g. I need someone to walk around the Shoreditch area and show me the best coffee shops, street art, and hidden gems. Should take about 1 hour.',
  'Property Walkthrough': 'e.g. Please visit the flat at 12 Baker St and do a full walkthrough — check the kitchen, bathrooms, windows, and any visible damage. Note anything unusual.',
  'Shopping Help': 'e.g. I need someone to visit Zara on Oxford St and check if the blue linen trousers (size M) are in stock. If yes, please purchase them.',
  'Event Attendance': 'e.g. Attend the product launch at ExCeL London on my behalf. Take notes, collect any brochures or swag, and take photos of the main presentations.',
  'Queue & Errands': 'e.g. Please queue at the Apple Store on Regent St for the new iPhone drop. Doors open at 8am, I need you there by 7am.',
  'Family Support': 'e.g. Help my elderly mother with her weekly grocery shopping at Waitrose. She needs someone patient who can assist her around the store.',
  'Business Inspection': 'e.g. Visit our supplier\'s warehouse and verify that the stock matches the invoice — 200 units of SKU-4421. Take photos of the pallets.',
  'Training & Coaching': 'e.g. Guide me through setting up my new home office. I need help with cable management, monitor positioning, and ergonomic setup. Remote session preferred.',
  'Campus Help': 'e.g. Please collect my transcript from the admin office at UCL and drop it at the post office on Gower St.',
  'Travel Assistance': 'e.g. Meet me at Heathrow Terminal 5 and help me navigate to my gate. I have mobility issues and need someone to assist with my luggage.',
  'DIY & Home Help': 'e.g. I need help assembling an IKEA KALLAX shelf (4x4). All parts are here. Should take around 2 hours. No special tools needed, just a screwdriver.',
  'Custom Request': 'Describe your task in as much detail as possible — what, where, when, and any specific requirements or preferences.',
};

const MEETING_PLATFORMS = ['Google Meet', 'Zoom', 'Microsoft Teams', 'WhatsApp Video', 'FaceTime', 'Skype', 'Base44 Live', 'Other'];

export default function CreateBooking() {
  const params = new URLSearchParams(window.location.search);
  const avatarId = params.get('avatar');
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [freeTest, setFreeTest] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'review'
  const [newEquipment, setNewEquipment] = useState('');

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
    service_location_type: 'onsite', // 'onsite' | 'remote'
    location: '',
    meeting_platform: '',
    notes: '',
    custom_request: '',
    stream_mode: 'no_camera',
    transport_required: false,
    transport_notes: '',
    equipment_needed: [],
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const LIVE_PREMIUM_PER_HOUR = 5;
  const rate = avatar?.hourly_rate || 30;
  const livePremium = form.stream_mode === 'live_camera' ? (LIVE_PREMIUM_PER_HOUR * form.duration_minutes / 60) : 0;
  const amount = (rate * form.duration_minutes / 60) + livePremium;
  const serviceFee = Math.round(amount * 0.15 * 100) / 100;
  const total = amount + serviceFee;

  const handleReview = () => {
    if (!form.category) { setError('Please select a service category.'); return; }
    if (form.service_location_type === 'onsite' && !form.location) { setError('Please enter the location / address.'); return; }
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
        location: form.service_location_type === 'onsite' ? form.location : '',
        meeting_platform: form.service_location_type === 'remote' ? form.meeting_platform : '',
        notes: form.notes,
        custom_request: form.custom_request,
        stream_mode: form.stream_mode,
        transport_required: form.service_location_type === 'onsite' ? form.transport_required : false,
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

      if (freeTest) {
        navigate(`/BookingDetail?id=${booking.id}`);
        return;
      }

      if (window.self !== window.top) {
        alert('Payment checkout only works on the published app. Please open the published link to complete payment.');
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
            form={form}
            avatar={avatar}
            amount={amount}
            livePremium={livePremium}
            serviceFee={serviceFee}
            total={total}
            freeTest={freeTest}
            loading={checkoutLoading}
            onBack={() => setStep('form')}
            onConfirm={createAndPay}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 px-4">
      <div className="max-w-2xl mx-auto pt-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-bold mb-2">Create Booking</h1>
        {avatar && (
          <div className="flex items-center gap-3 mb-8">
            {avatar.photo_url ? (
              <img src={avatar.photo_url} className="w-10 h-10 rounded-full object-cover border border-white/10" alt={avatar.display_name} />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {avatar.display_name?.[0] || 'A'}
              </div>
            )}
            <p className="text-muted-foreground text-sm">Booking with <span className="text-foreground font-medium">{avatar.display_name}</span> — ${rate}/hr</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Service Details */}
          <GlassCard className="p-6 space-y-4">
            <h2 className="font-semibold">Service Details</h2>
            <CameraOptionPicker value={form.stream_mode} onChange={v => update('stream_mode', v)} premiumRate={LIVE_PREMIUM_PER_HOUR} />
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
              <label className="text-sm font-medium mb-1.5 block">Booking Type</label>
              <Select value={form.booking_type} onValueChange={v => update('booking_type', v)}>
                <SelectTrigger className="bg-muted/50 border-white/5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate / On-demand</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </GlassCard>

          {/* Schedule */}
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

          {/* Service Location Type */}
          <GlassCard className="p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              {form.service_location_type === 'onsite' ? <MapPin className="w-4 h-4 text-primary" /> : <Wifi className="w-4 h-4 text-primary" />}
              Service Location
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'onsite', label: '📍 On-site', sub: 'Avatar physically attends' },
                { value: 'remote', label: '🌐 Remote', sub: 'Virtual / online session' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('service_location_type', opt.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    form.service_location_type === opt.value
                      ? 'bg-primary/10 border-primary/40 text-foreground'
                      : 'bg-muted/30 border-white/5 text-muted-foreground hover:border-white/10'
                  }`}
                >
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs mt-0.5 opacity-70">{opt.sub}</p>
                </button>
              ))}
            </div>

            {form.service_location_type === 'onsite' ? (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Address / Location</label>
                <Input value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. 12 Baker St, London, W1U 3BW" className="bg-muted/50 border-white/5" />
                <p className="text-xs text-muted-foreground mt-1">Full address where the avatar should be present.</p>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Meeting Platform</label>
                <Select value={form.meeting_platform} onValueChange={v => update('meeting_platform', v)}>
                  <SelectTrigger className="bg-muted/50 border-white/5"><SelectValue placeholder="Select platform" /></SelectTrigger>
                  <SelectContent>
                    {MEETING_PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">The avatar will connect via this platform at the scheduled time.</p>
              </div>
            )}
          </GlassCard>

          {/* Transport — only relevant for on-site */}
          {form.service_location_type === 'onsite' && (
            <GlassCard className="p-6 space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><Truck className="w-4 h-4 text-primary" /> Transport</h2>
              <button
                type="button"
                onClick={() => update('transport_required', !form.transport_required)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm ${
                  form.transport_required ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/30 border-white/5 text-muted-foreground'
                }`}
              >
                <span>Transport / travel required for this avatar</span>
                <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.transport_required ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.transport_required ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
              {form.transport_required && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Transport details</label>
                  <Input value={form.transport_notes} onChange={e => update('transport_notes', e.target.value)} placeholder="e.g. Uber provided, public transport from Zone 1, parking available…" className="bg-muted/50 border-white/5" />
                </div>
              )}
            </GlassCard>
          )}

          {/* Equipment & Tools */}
          <GlassCard className="p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Wrench className="w-4 h-4 text-primary" /> Equipment & Tools</h2>
            <p className="text-xs text-muted-foreground">List any specific devices, tools or items the avatar should bring or have access to.</p>
            <div className="flex gap-2">
              <Input
                value={newEquipment}
                onChange={e => setNewEquipment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newEquipment.trim()) {
                    e.preventDefault();
                    update('equipment_needed', [...form.equipment_needed, newEquipment.trim()]);
                    setNewEquipment('');
                  }
                }}
                placeholder="e.g. smartphone, 360 camera, drill…"
                className="bg-muted/50 border-white/5"
              />
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
          </GlassCard>

          {/* Notes */}
          <GlassCard className="p-6 space-y-3">
            <h2 className="font-semibold">Task Instructions</h2>
            {form.category && CATEGORY_PROMPTS[form.category] && (
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1 font-medium">💡 Tip for "{form.category}":</p>
                <p className="text-xs text-muted-foreground italic">{CATEGORY_PROMPTS[form.category]}</p>
              </div>
            )}
            <Textarea
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder={form.category ? `Describe your task in detail…` : 'Select a category above to see guiding tips, then describe your task here…'}
              className="bg-muted/50 border-white/5 h-28"
            />
          </GlassCard>

          {/* Price Summary */}
          <GlassCard className="p-6">
            <h2 className="font-semibold mb-4">Price Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Service ({form.duration_minutes} min × ${rate}/hr)</span><span>${(amount - livePremium).toFixed(2)}</span></div>
              {livePremium > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Live camera premium</span><span className="text-primary">+${livePremium.toFixed(2)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Platform fee (15%)</span><span>${serviceFee.toFixed(2)}</span></div>
              <div className="border-t border-white/5 pt-2 flex justify-between font-semibold text-base">
                <span>Total</span><span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
          </GlassCard>

          {/* Free test toggle */}
          <button
            type="button"
            onClick={() => setFreeTest(v => !v)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm ${
              freeTest ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-card/40 border-white/5 text-muted-foreground hover:border-white/10'
            }`}
          >
            <FlaskConical className="w-4 h-4 shrink-0" />
            <div className="text-left flex-1">
              <p className="font-medium">Free test booking ($0)</p>
              <p className="text-xs opacity-70">Skip payment — book instantly for testing</p>
            </div>
            <div className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${freeTest ? 'bg-yellow-500' : 'bg-muted'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${freeTest ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

          <Button
            className="w-full py-5 text-base gap-2 bg-primary hover:bg-primary/90 glow-primary-sm"
            onClick={handleReview}
            disabled={!form.category}
          >
            Review Booking →
          </Button>
          <p className="text-xs text-center text-muted-foreground">You'll review all details before payment.</p>
        </div>
      </div>
    </div>
  );
}