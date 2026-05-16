import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2, Coins } from 'lucide-react';

export default function SimulatedPaymentModal({ job, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const amount = job.escrow_amount || job.budget_max || job.budget_min || 50;

  const handleConfirm = async () => {
    setLoading(true);
    // Simulate escrow: just update the job record with fake escrow info
    await base44.entities.JobPost.update(job.id, {
      escrow_amount: amount,
      escrow_status: 'authorized',
      stripe_payment_intent_id: `sim_${job.id}_${Date.now()}`,
    });
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="glass rounded-2xl p-6 border border-primary/20 space-y-4">
      <div className="flex items-center gap-2">
        <Coins className="w-5 h-5 text-yellow-400" />
        <h3 className="font-bold text-base">Test Mode — Simulated Payment</h3>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-300 space-y-1">
        <p className="font-semibold">🧪 This is fake money for testing</p>
        <p className="text-xs text-muted-foreground">No real card is required. The system will simulate holding <span className="font-semibold text-foreground">${amount}</span> in escrow.</p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold">Funds held in simulated escrow</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-medium text-foreground">${amount}</span> will be "held" and released to the avatar after you approve their work — or automatically after 24 hours.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button className="flex-1 gap-2" onClick={handleConfirm} disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <>Authorize ${amount} (Test)</>}
        </Button>
        <Button type="button" variant="outline" className="border-white/10" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}