import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Clock, Plus, Trash2, Save, CheckCircle } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_SLOTS = DAYS.map(day => ({ day, enabled: day !== 'Sunday', from: '09:00', to: '18:00' }));

export default function AvailabilityManager({ avatarProfile }) {
  const [slots, setSlots] = useState(DEFAULT_SLOTS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (avatarProfile?.availability_slots) {
      setSlots(avatarProfile.availability_slots);
    }
  }, [avatarProfile?.id]);

  const toggle = (day) => setSlots(prev => prev.map(s => s.day === day ? { ...s, enabled: !s.enabled } : s));
  const update = (day, key, val) => setSlots(prev => prev.map(s => s.day === day ? { ...s, [key]: val } : s));

  const save = async () => {
    if (!avatarProfile?.id) return;
    setSaving(true);
    await base44.entities.AvatarProfile.update(avatarProfile.id, { availability_slots: slots });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Availability Hours
        </h3>
        <Button size="sm" className="bg-primary gap-2" onClick={save} disabled={saving}>
          {saved ? <><CheckCircle className="w-3.5 h-3.5" /> Saved!</> : saving ? 'Saving…' : <><Save className="w-3.5 h-3.5" /> Save</>}
        </Button>
      </div>

      <div className="space-y-3">
        {slots.map(slot => (
          <div key={slot.day} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${slot.enabled ? 'border-primary/20 bg-primary/5' : 'border-white/5 bg-muted/20'}`}>
            {/* Toggle */}
            <button
              onClick={() => toggle(slot.day)}
              className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${slot.enabled ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${slot.enabled ? 'left-5' : 'left-0.5'}`} />
            </button>

            <span className={`text-sm font-medium w-24 flex-shrink-0 ${slot.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
              {slot.day}
            </span>

            {slot.enabled ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={slot.from}
                  onChange={e => update(slot.day, 'from', e.target.value)}
                  className="text-xs bg-card/60 border border-white/10 rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:border-primary/40"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="time"
                  value={slot.to}
                  onChange={e => update(slot.day, 'to', e.target.value)}
                  className="text-xs bg-card/60 border border-white/10 rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:border-primary/40"
                />
              </div>
            ) : (
              <span className="text-xs text-muted-foreground flex-1">Unavailable</span>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}