import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';

let stripePromise = null;
const getStripe = async () => {
  if (!stripePromise) {
    const res = await base44.functions.invoke('getStripeKey', {});
    stripePromise = loadStripe(res.data.publishableKey);
  }
  return stripePromise;
};

function CheckoutForm({ jobTitle, amount, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message);
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold">Funds held in escrow</p>
          <p className="text-xs text-muted-foreground mt-0.5">Your payment of <span className="font-medium text-foreground">${amount}</span> will be authorized now but only released to the avatar after you confirm the job is complete.</p>
        </div>
      </div>

      <PaymentElement />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" className="flex-1 gap-2" disabled={!stripe || loading}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><Lock className="w-4 h-4" /> Authorize ${amount}</>}
        </Button>
        <Button type="button" variant="outline" className="border-white/10" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function JobPaymentModal({ job, onSuccess, onCancel }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const amount = job.escrow_amount || job.budget_max || job.budget_min || 0;

  const [stripeInstance, setStripeInstance] = useState(null);

  useEffect(() => {
    Promise.all([
      getStripe(),
      base44.functions.invoke('createJobPayment', { jobId: job.id, amountUSD: amount })
    ]).then(([stripe, res]) => {
        setStripeInstance(stripe);
        if (res.data?.clientSecret) {
          setClientSecret(res.data.clientSecret);
        } else {
          setError(res.data?.error || 'Failed to initialize payment');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [job.id, amount]);

  if (loading) return (
    <div className="glass rounded-2xl p-6 border border-primary/20 flex items-center justify-center gap-3 py-10">
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
      <span className="text-sm">Setting up secure payment…</span>
    </div>
  );

  if (error) return (
    <div className="glass rounded-2xl p-6 border border-red-500/20 space-y-3">
      <p className="text-sm text-red-400">Payment setup failed: {error}</p>
      <Button variant="outline" className="border-white/10" onClick={onCancel}>Go Back</Button>
    </div>
  );

  const appearance = { theme: 'night', variables: { colorPrimary: '#e0314e' } };

  return (
    <div className="glass rounded-2xl p-6 border border-primary/20 space-y-4">
      <div>
        <h3 className="font-bold text-base">Secure Payment</h3>
        <p className="text-xs text-muted-foreground mt-0.5">For: {job.title}</p>
      </div>
      <Elements stripe={stripeInstance} options={{ clientSecret, appearance }}>
        <CheckoutForm jobTitle={job.title} amount={amount} onSuccess={onSuccess} onCancel={onCancel} />
      </Elements>
    </div>
  );
}