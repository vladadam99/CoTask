import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Video, Clock, Calendar, Shield, Star, MapPin, Loader2, CheckCircle2, FlaskConical } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SESSION_TYPE_LABELS = {
  consultation: 'Consultation',
  class: 'Class',
  coaching: 'Coaching',
  qa_session: 'Q&A Session',
  mentoring: 'Mentoring',
};

export default function ConsultationBooking() {
  const params = new URLSearchParams(window.location.search);
  const offeringId = params.get('offering');
  const avatarId = params.get('avatar');

  const { user } = useCurrentUser();
  const navigate = useNavigate();

  const [step, setStep] = useState('pick'); // pick | confirm | done
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [freeTest, setFreeTest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);
  const [callUrl, setCallUrl] = useState('');

  const { data: offering } = useQuery({
    queryKey: ['offering', offeringId],
    queryFn: async () => {
      const list = await base44.entities.ExpertiseOffering.list('-created_date', 200);
      return list.find(o => o.id === offeringId) || null;
    },
    enabled: !!offeringId,
  });

  const { data: avatar } = useQuery({
    queryKey: ['consult-avatar', avatarId],
    queryFn: () => base44.entities.AvatarProfile.get(avatarId),
    enabled: !!avatarId,
  });

  const rate = offering?.rate || 0;
  const serviceFee = Math.round(rate * 0.15 * 100) / 100;
  const total = rate + serviceFee;

  // Build available time slots from office_hours
  const officeHours = offering?.office_hours || [];
  const todayDay = selectedDate
    ? DAYS[new Date(selectedDate + 'T12:00:00').getDay() === 0 ? 6 : new Date(selectedDate + 'T12:00:00').getDay() - 1]
    : null;
  const daySlot = officeHours.find(s => s.day === todayDay && s.enabled);

  const generateTimeSlots = (from, to, durationMin) => {
    if (!from || !to) return [];
    const slots = [];
    const [fh, fm] = from.split(':').map(Number);
    const [th, tm] = to.split(':').map(Number);
    let cur = fh * 60 + fm;
    const end = th * 60 + tm;
    while (cur + durationMin <= end) {
      const h = Math.floor(cur / 60).toString().padStart(2, '0');
      const m = (cur % 60).toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
      cur += durationMin;
    }
    return slots;
  };

  const timeSlots = daySlot
    ? generateTimeSlots(daySlot.from, daySlot.to, offering?.duration_minutes || 60)
    : [];

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) { setError('Please pick a date and time.'); return; }
    setError('');
    setLoading(true);
    try {
      const newBooking = await base44.entities.Booking.create({
        client_email: user.email,
        client_name: user.full_name,
        client_type: 'user',
        avatar_email: avatar?.user_email || offering?.avatar_email || '',
        avatar_name: avatar?.display_name || offering?.avatar_name || '',
        avatar_profile_id: avatarId || offering?.avatar_profile_id || '',
        category: offering?.topic || 'Consultation',
        service_type: offering?.session_type || 'consultation',
        booking_type: 'scheduled',
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        duration_minutes: offering?.duration_minutes || 60,
        service_location_type: 'remote',
        notes: notes,
        stream_mode: 'live_camera',
        amount: freeTest ? 0 : rate,
        service_fee: freeTest ? 0 : serviceFee,
        total_amount: freeTest ? 0 : total,
        status: 'pending',
        payment_status: freeTest ? 'paid' : 'pending',
        session_id: null,
      });

      setBooking(newBooking);

      // Create conversation
      base44.functions.invoke('createConversation', { bookingId: newBooking.id }).catch(() => {});

      // Notification is handled securely by createConversation in the backend

      // Generate video call room
      if (freeTest) {
        try {
          const room = await base44.functions.invoke('createDailyRoom', { bookingId: newBooking.id });
          setCallUrl(room?.data?.url || '');
          if (room?.data?.url) {
            await base44.entities.Booking.update(newBooking.id, { meeting_platform: room.data.url });
          }
        } catch (_) {}
      }

      if (!freeTest) {
        // Redirect to checkout
        if (window.self !== window.top) {
          alert('Payment checkout only works on the published app.');
          setLoading(false);
          return;
        }
        const res = await base44.functions.invoke('createCheckout', {
          bookingId: newBooking.id,
          amount: total,
          avatarName: avatar?.display_name || offering?.avatar_name,
          category: offering?.title || 'Consultation Session',
        });
        if (res.data?.url) {
          window.location.href = res.data.url;
          return;
        } else {
          throw new Error(res.data?.error || 'Failed to create checkout');
        }
      }

      setStep('done');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black mb-2">Request Sent! 🎉</h1>
            <p className="text-muted-foreground text-sm">
              Your consultation request for <strong>{selectedDate}</strong> at <strong>{selectedTime}</strong> has been sent.
              The expert will confirm or decline shortly.
            </p>
          </div>

          {callUrl && (
            <GlassCard className="p-5 text-left space-y-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-primary" />
                <p className="font-semibold text-sm">Your Video Call Link</p>
              </div>
              <p className="text-xs text-muted-foreground">This link will be active at the scheduled time.</p>
              <a href={callUrl} target="_blank" rel="noopener noreferrer"
                className="block text-primary text-sm font-medium hover:underline truncate">{callUrl}</a>
              <Button className="w-full gap-2" onClick={() => window.open(callUrl, '_blank')}>
                <Video className="w-4 h-4" /> Join Call Now
              </Button>
            </GlassCard>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate('/Bookings')} className="w-full">View My Bookings</Button>
            <Button variant="outline" className="w-full border-white/10" onClick={() => navigate(-1)}>Back to Profile</Button>
          </div>
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

        {/* Offering Header */}
        {offering && avatar && (
          <GlassCard className="p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-black text-primary overflow-hidden flex-shrink-0">
                {avatar.photo_url
                  ? <img src={avatar.photo_url} alt={avatar.display_name} className="w-full h-full object-cover" />
                  : avatar.display_name?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold">{avatar.display_name}</p>
                  {avatar.is_verified && <Shield className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                  {avatar.rating > 0 && (
                    <span className="flex items-center gap-1 text-xs text-yellow-400 font-semibold ml-auto">
                      <Star className="w-3 h-3 fill-yellow-400" /> {avatar.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                {avatar.city && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {avatar.city}</p>}
                <div className="mt-3 pt-3 border-t border-white/5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {SESSION_TYPE_LABELS[offering.session_type] || offering.session_type}
                  </span>
                  <h2 className="font-bold text-lg mt-2">{offering.title}</h2>
                  {offering.description && <p className="text-sm text-muted-foreground mt-1">{offering.description}</p>}
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {offering.duration_minutes} min</span>
                    <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Video call included</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        <div className="space-y-5">
          {/* Date Picker */}
          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Pick a Date</h2>
            </div>
            <Input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => { setSelectedDate(e.target.value); setSelectedTime(''); }}
              className="bg-muted/50 border-white/5"
            />
          </GlassCard>

          {/* Time Slots */}
          {selectedDate && (
            <GlassCard className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">Pick a Time</h2>
                {todayDay && <span className="text-xs text-muted-foreground ml-auto">{todayDay}</span>}
              </div>
              {timeSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map(t => (
                    <button key={t} type="button"
                      onClick={() => setSelectedTime(t)}
                      className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                        selectedTime === t
                          ? 'bg-primary/20 border-primary/40 text-primary'
                          : 'bg-muted/30 border-white/5 text-muted-foreground hover:border-white/20'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {officeHours.length === 0
                      ? 'No office hours set — pick any time and the expert will confirm.'
                      : `No expert hours on ${todayDay}. Pick another day or enter a time below.`}
                  </p>
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={e => setSelectedTime(e.target.value)}
                    className="bg-muted/50 border-white/5"
                  />
                </div>
              )}
            </GlassCard>
          )}

          {/* Notes */}
          <GlassCard className="p-5 space-y-3">
            <h2 className="font-semibold text-sm">What do you want to discuss? (optional)</h2>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. I'm a beginner learning React and need help with state management..."
              rows={3}
              className="bg-muted/50 border-white/5 text-sm resize-none"
            />
          </GlassCard>

          {/* What's included */}
          <GlassCard className="p-5 space-y-2">
            <h2 className="font-semibold text-sm mb-3">What's included</h2>
            {[
              { icon: Video, text: 'Private video call link auto-generated at booking time' },
              { icon: Clock, text: `${offering?.duration_minutes || 60} minute live session` },
              { icon: Shield, text: 'Payment held in escrow — released after session' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </GlassCard>

          {/* Pricing */}
          <GlassCard className="p-5 space-y-2">
            <h2 className="font-semibold text-sm mb-2">Pricing</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Consultation fee</span>
                <span className="text-foreground">${rate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Platform fee (15%)</span>
                <span className="text-foreground">${serviceFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/5 pt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">${freeTest ? '0.00' : total.toFixed(2)}</span>
              </div>
            </div>
          </GlassCard>

          {/* Free test */}
          <button type="button" onClick={() => setFreeTest(v => !v)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm ${freeTest ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-card/40 border-white/5 text-muted-foreground hover:border-white/10'}`}>
            <FlaskConical className="w-4 h-4 shrink-0" />
            <div className="text-left flex-1">
              <p className="font-medium">Free test booking</p>
              <p className="text-xs opacity-70">Skip payment — video call link generated instantly</p>
            </div>
            <div className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${freeTest ? 'bg-yellow-500' : 'bg-muted'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${freeTest ? 'translate-x-4' : ''}`} />
            </div>
          </button>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

          <Button
            className="w-full py-5 text-base gap-2 glow-primary-sm"
            onClick={handleConfirm}
            disabled={loading || !selectedDate || !selectedTime}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Setting up your session...</>
            ) : (
              <><Video className="w-4 h-4" /> {freeTest ? 'Book Free Session' : `Book & Pay $${total.toFixed(2)}`}</>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground pb-4">
            A video call link will be generated automatically. Payment is held in escrow until after the session.
          </p>
        </div>
      </div>
    </div>
  );
}