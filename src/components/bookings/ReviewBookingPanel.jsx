import React from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Wifi, Truck, Wrench, CreditCard, Loader2, CheckCircle } from 'lucide-react';

const Row = ({ label, value, icon: IconComp }) => (
  <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
    {IconComp && <IconComp className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  </div>
);

export default function ReviewBookingPanel({ form, avatar, amount, livePremium, serviceFee, total, loading, onBack, onConfirm }) {
  const durationLabel = { 30: '30 minutes', 60: '1 hour', 90: '1.5 hours', 120: '2 hours', 180: '3 hours' }[form.duration_minutes] || `${form.duration_minutes} min`;
  const rate = avatar?.hourly_rate || 30;

  if (!avatar) {
    return (
      <GlassCard className="p-8 max-w-md mx-auto text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <span className="text-primary text-2xl">🔍</span>
        </div>
        <h2 className="text-xl font-bold">Choose a Local Agent first</h2>
        <p className="text-sm text-muted-foreground">
          Direct Hire requests must be connected to a specific Local Agent. Go back to Discover and choose who you want to request.
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Button className="w-full" asChild>
            <Link to="/FindPeople">Discover Local Agents</Link>
          </Button>
          <Button variant="outline" className="w-full border-white/10" asChild>
            <Link to="/PostJob">Post an Open Task</Link>
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold">Review Task</h2>
          <p className="text-xs text-muted-foreground">Please confirm all details before payment</p>
        </div>
      </div>

      {/* Avatar */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-3">
          {avatar?.photo_url ? (
            <img src={avatar.photo_url} className="w-12 h-12 rounded-full object-cover border border-white/10" alt={avatar.display_name} />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
              {avatar?.display_name?.[0] || 'A'}
            </div>
          )}
          <div>
            <p className="font-semibold">{avatar?.display_name || 'Agent'}</p>
            <p className="text-xs text-muted-foreground">${rate}/hr · {avatar?.city || ''}</p>
          </div>
        </div>
      </GlassCard>

      {/* Service Details */}
      <GlassCard className="p-5">
        <h3 className="font-semibold text-sm mb-1 text-muted-foreground uppercase tracking-wider">Service</h3>
        <Row label="Category" value={form.category} />
        <Row label="Task Type" value={form.booking_type === 'immediate' ? 'Immediate / On-demand' : 'Scheduled'} />
        <Row label="Service Mode" value={
          form.stream_mode === 'live_camera'
            ? '🎥 Live Camera Stream (+$' + livePremium.toFixed(2) + ')'
            : '📵 No Camera (Updates via messages)'
        } />
        {form.booking_type === 'scheduled' && (
          <>
            <Row icon={Calendar} label="Date" value={form.scheduled_date || '—'} />
            <Row icon={Clock} label="Time" value={form.scheduled_time || '—'} />
            <Row icon={Clock} label="Duration" value={durationLabel} />
          </>
        )}
      </GlassCard>

      {/* Location */}
      <GlassCard className="p-5">
        <h3 className="font-semibold text-sm mb-1 text-muted-foreground uppercase tracking-wider">Location</h3>
        {form.service_location_type === 'remote' ? (
          <>
            <Row icon={Wifi} label="Service Type" value="Remote / Virtual" />
            {form.meeting_platform && <Row label="Meeting Platform" value={form.meeting_platform} />}
          </>
        ) : (
          <>
            <Row icon={MapPin} label="Service Type" value="On-site" />
            <Row label="Address" value={form.location || '—'} />
          </>
        )}
      </GlassCard>

      {/* Transport */}
      <GlassCard className="p-5">
        <h3 className="font-semibold text-sm mb-1 text-muted-foreground uppercase tracking-wider">Transport</h3>
        <Row icon={Truck} label="Transport Required" value={form.transport_required ? 'Yes' : 'No'} />
        {form.transport_required && form.transport_notes && (
          <Row label="Transport Details" value={form.transport_notes} />
        )}
      </GlassCard>

      {/* Equipment */}
      {form.equipment_needed?.length > 0 && (
        <GlassCard className="p-5">
          <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2"><Wrench className="w-3.5 h-3.5" /> Equipment / Tools</h3>
          <div className="flex flex-wrap gap-2">
            {form.equipment_needed.map((eq, i) => (
              <span key={i} className="bg-white/5 border border-white/10 text-sm px-3 py-1 rounded-full">{eq}</span>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Notes */}
      {form.notes && (
        <GlassCard className="p-5">
          <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wider">Instructions</h3>
          <p className="text-sm text-foreground whitespace-pre-line">{form.notes}</p>
        </GlassCard>
      )}

      {/* Price Summary */}
      <GlassCard className="p-5">
        <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Price Breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Service ({form.duration_minutes} min × ${rate}/hr)</span><span>${(amount - livePremium).toFixed(2)}</span></div>
          {livePremium > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Live camera premium</span><span className="text-primary">+${livePremium.toFixed(2)}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Platform fee (15%)</span><span>${serviceFee.toFixed(2)}</span></div>
          <div className="border-t border-white/5 pt-2 flex justify-between font-bold text-base">
            <span>Total</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
      </GlassCard>

      <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-2 text-green-400 text-sm">
        <CheckCircle className="w-4 h-4 shrink-0" />
        Secure Payment will be requested after the Local Agent accepts.
      </div>

      <Button
        className="w-full py-5 text-base gap-2 bg-primary hover:bg-primary/90 glow-primary-sm"
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Sending Request…</>
        ) : (
          <><CreditCard className="w-4 h-4" /> Send Direct Hire Request</>
        )}
      </Button>
    </div>
  );
}