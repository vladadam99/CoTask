import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle2, Clock, AlertCircle, ChevronRight, Banknote, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PAYOUT_SCHEDULES = [
  { id: 'instant', label: 'Instant', desc: '1% fee · funds within minutes', icon: Zap },
  { id: 'daily', label: 'Daily', desc: 'No fee · next business day', icon: Clock },
  { id: 'weekly', label: 'Weekly', desc: 'No fee · every Monday', icon: Banknote },
];

export default function PayoutSetup({ profile }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState(profile?.payout_status === 'active' ? 'active' : 'setup');
  const [form, setForm] = useState({ account_name: '', account_number: '', routing: '', schedule: 'weekly' });
  const [saving, setSaving] = useState(false);

  const handleConnect = async () => {
    if (!form.account_name || !form.account_number || !form.routing) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    await base44.entities.AvatarProfile.update(profile.id, { payout_status: 'pending' });
    queryClient.invalidateQueries({ queryKey: ['avatar-profile-earnings'] });
    // Simulate verification delay
    setTimeout(async () => {
      await base44.entities.AvatarProfile.update(profile.id, { payout_status: 'active' });
      queryClient.invalidateQueries({ queryKey: ['avatar-profile-earnings'] });
      setStep('active');
      toast({ title: 'Payout account connected!', description: 'Earnings will be paid out automatically.' });
    }, 1500);
    setSaving(false);
  };

  if (step === 'active' || profile?.payout_status === 'active') {
    return (
      <GlassCard className="p-5 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Payout Account Active</p>
            <p className="text-xs text-muted-foreground mt-0.5">Earnings are automatically transferred after each completed session.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setStep('setup')} className="shrink-0 gap-1">
            <CreditCard className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {PAYOUT_SCHEDULES.map(s => (
            <div
              key={s.id}
              onClick={() => setForm(f => ({ ...f, schedule: s.id }))}
              className={`rounded-xl border p-3 cursor-pointer transition-all ${form.schedule === s.id ? 'border-primary/40 bg-primary/10' : 'border-white/10 bg-secondary/30 hover:border-white/20'}`}
            >
              <s.icon className={`w-4 h-4 mb-1.5 ${form.schedule === s.id ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className={`text-xs font-semibold ${form.schedule === s.id ? 'text-primary' : ''}`}>{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    );
  }

  if (profile?.payout_status === 'pending') {
    return (
      <GlassCard className="p-5 mb-8 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-yellow-400 animate-pulse" />
        </div>
        <div>
          <p className="font-semibold text-sm">Verification In Progress</p>
          <p className="text-xs text-muted-foreground mt-0.5">We are verifying your bank details. This usually takes 1–2 business days.</p>
        </div>
      </GlassCard>
    );
  }

  // Not connected — show setup form
  return (
    <GlassCard className="p-5 mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <CreditCard className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">Set Up Automated Payouts</p>
          <p className="text-xs text-muted-foreground">Connect your bank account to receive earnings automatically</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-5">
        {PAYOUT_SCHEDULES.map(s => (
          <div
            key={s.id}
            onClick={() => setForm(f => ({ ...f, schedule: s.id }))}
            className={`rounded-xl border p-3 cursor-pointer transition-all ${form.schedule === s.id ? 'border-primary/40 bg-primary/10' : 'border-white/10 bg-secondary/30 hover:border-white/20'}`}
          >
            <s.icon className={`w-4 h-4 mb-1.5 ${form.schedule === s.id ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className={`text-xs font-semibold ${form.schedule === s.id ? 'text-primary' : ''}`}>{s.label}</p>
            <p className="text-xs text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 mb-5">
        <input
          className="w-full bg-secondary/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
          placeholder="Account holder name"
          value={form.account_name}
          onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="bg-secondary/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
            placeholder="Account number"
            value={form.account_number}
            onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
          />
          <input
            className="bg-secondary/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
            placeholder="Routing number"
            value={form.routing}
            onChange={e => setForm(f => ({ ...f, routing: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-muted-foreground mb-4">
        <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
        Your banking details are encrypted and never stored in plain text. Payouts are processed securely.
      </div>

      <Button className="w-full gap-2" onClick={handleConnect} disabled={saving}>
        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ChevronRight className="w-4 h-4" />}
        {saving ? 'Connecting…' : 'Connect Bank Account'}
      </Button>
    </GlassCard>
  );
}