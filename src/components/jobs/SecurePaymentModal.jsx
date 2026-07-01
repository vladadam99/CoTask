import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2, Coins, AlertCircle } from 'lucide-react';

export default function SecurePaymentModal({ job, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const amount = job.escrow_amount || job.budget_max || job.budget_min || 50;

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('createTaskCheckout', {
        task_type: job.task_type || 'job',
        task_id: job.id,
        success_url: window.location.href,
        cancel_url: window.location.href,
      });
      if (response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
        onSuccess?.(response.data);
        return;
      }
      setError(response.data?.error || 'Failed to start checkout. Please try again.');
    } catch (e) {
      setError('Error connecting to the payment provider. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-xl p-6 border border-primary/20 space-y-4">
      <div className="flex items-center gap-2">
        <Coins className="w-5 h-5 text-yellow-400" />
        <h3 className="font-bold text-base">Secure Payment Checkout</h3>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-300 space-y-1">
        <p className="font-semibold">Secure Payment</p>
        <p className="text-xs text-muted-foreground">Stripe will securely hold <span className="font-semibold text-foreground">${amount}</span> until you approve the completed work.</p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3" title="Held after both sides agree. Released after client approval.">
        <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold">Funds held securely</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-medium text-foreground">${amount}</span> will be held and released to the agent after you approve their work.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button className="flex-1 gap-2" onClick={handleConfirm} disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing secure payment...</> : <>Fund Secure Payment</>}
        </Button>
        <Button type="button" variant="outline" className="border-border" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
