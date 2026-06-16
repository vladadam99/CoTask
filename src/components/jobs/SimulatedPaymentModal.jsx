import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2, Coins } from 'lucide-react';

export default function SimulatedPaymentModal({ job, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const amount = job.escrow_amount || job.budget_max || job.budget_min || 50;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createTaskCheckout', {
        task_type: job.task_type || 'job', // Fallback to job if not provided
        task_id: job.id,
        success_url: window.location.href,
        cancel_url: window.location.href,
      });
      if (response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        alert(response.data?.error || 'Failed to start checkout');
        setLoading(false);
      }
    } catch (e) {
      alert('Error connecting to payment provider.');
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 border border-primary/20 space-y-4">
      <div className="flex items-center gap-2">
        <Coins className="w-5 h-5 text-yellow-400" />
        <h3 className="font-bold text-base">Secure Payment Checkout</h3>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-300 space-y-1">
        <p className="font-semibold">🧪 Test secure payment simulation</p>
        <p className="text-xs text-muted-foreground">Using Stripe Test Mode. The system will securely hold <span className="font-semibold text-foreground">${amount}</span>.</p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold">Funds held securely</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-medium text-foreground">${amount}</span> will be held and released to the agent after you approve their work.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button className="flex-1 gap-2" onClick={handleConfirm} disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing secure payment…</> : <>Fund Secure Payment</>}
        </Button>
        <Button type="button" variant="outline" className="border-white/10" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}