import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { CreditCard, RefreshCw, CheckCircle2, ChevronDown } from 'lucide-react';

const METHODS = [
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'stripe', label: 'Stripe Connect' },
  { id: 'wise', label: 'Wise' },
];

const SCHEDULES = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Bi-weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export default function PayoutSetup({ avatarEmail }) {
  const queryClient = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ['payout-settings', avatarEmail],
    queryFn: async () => {
      const r = await base44.entities.PayoutSettings.filter({ avatar_email: avatarEmail });
      return r[0] || null;
    },
    enabled: !!avatarEmail,
  });

  const [form, setForm] = useState({
    method: 'bank_transfer', account_name: '', account_number: '',
    routing_number: '', paypal_email: '', wise_email: '',
    schedule: 'weekly', minimum_payout: 20, currency: 'USD',
  });

  useEffect(() => {
    if (existing) setForm(f => ({ ...f, ...existing }));
  }, [existing]);

  const save = useMutation({
    mutationFn: async (data) => {
      if (existing?.id) return base44.entities.PayoutSettings.update(existing.id, { ...data, is_active: true });
      return base44.entities.PayoutSettings.create({ ...data, avatar_email: avatarEmail, is_active: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payout-settings', avatarEmail] }),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <GlassCard className="p-6 mb-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Automated Payouts</h2>
          <p className="text-xs text-muted-foreground">Configure how and when you receive your earnings</p>
        </div>
        {existing?.is_active && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
            <CheckCircle2 className="w-4 h-4" /> Active
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {/* Payout method */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Payout Method</label>
          <div className="relative">
            <select
              value={form.method}
              onChange={e => set('method', e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm appearance-none pr-8"
            >
              {METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Schedule */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Payout Schedule</label>
          <div className="flex gap-2">
            {SCHEDULES.map(s => (
              <button
                key={s.id}
                onClick={() => set('schedule', s.id)}
                className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${form.schedule === s.id ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Method-specific fields */}
      {form.method === 'bank_transfer' && (
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          {[
            { key: 'account_name', label: 'Account Name', placeholder: 'John Smith' },
            { key: 'account_number', label: 'Account Number', placeholder: '••••••••1234' },
            { key: 'routing_number', label: 'Routing Number', placeholder: '021000021' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-muted-foreground mb-1.5 block">{f.label}</label>
              <input
                type="text"
                value={form[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      )}
      {form.method === 'paypal' && (
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1.5 block">PayPal Email</label>
          <input
            type="email"
            value={form.paypal_email}
            onChange={e => set('paypal_email', e.target.value)}
            placeholder="you@paypal.com"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm max-w-sm"
          />
        </div>
      )}
      {form.method === 'wise' && (
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1.5 block">Wise Email</label>
          <input
            type="email"
            value={form.wise_email}
            onChange={e => set('wise_email', e.target.value)}
            placeholder="you@wise.com"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm max-w-sm"
          />
        </div>
      )}

      {/* Minimum payout */}
      <div className="flex items-center gap-4 mb-5">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Minimum Payout ($)</label>
          <input
            type="number"
            min={5}
            value={form.minimum_payout}
            onChange={e => set('minimum_payout', Number(e.target.value))}
            className="w-28 bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        {existing?.last_payout_date && (
          <div className="text-xs text-muted-foreground">
            Last payout: <span className="text-foreground font-medium">${existing.last_payout_amount || 0}</span> on {existing.last_payout_date}
          </div>
        )}
      </div>

      <Button
        onClick={() => save.mutate(form)}
        disabled={save.isPending}
        className="gap-2"
      >
        {save.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        {existing?.is_active ? 'Update Payout Settings' : 'Activate Automated Payouts'}
      </Button>
    </GlassCard>
  );
}