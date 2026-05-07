import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, Loader2, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export default function IdentityVerification({ profileId, profileType, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | pending | verified | failed
  const [pollingInterval, setPollingInterval] = useState(null);

  // On mount, check if already verified
  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.identity_verified) setStatus('verified');
      else if (u?.identity_verification_status === 'rejected') setStatus('failed');
    });
  }, []);

  // Poll for verification status after launching Stripe
  const startPolling = () => {
    const interval = setInterval(async () => {
      try {
        const u = await base44.auth.me();
        if (u?.identity_verified) {
          clearInterval(interval);
          setPollingInterval(null);
          setStatus('verified');
          if (onComplete) onComplete({ success: true });
        } else if (u?.identity_verification_status === 'rejected') {
          clearInterval(interval);
          setPollingInterval(null);
          setStatus('failed');
        }
      } catch (e) {}
    }, 3000);
    setPollingInterval(interval);
    return interval;
  };

  useEffect(() => {
    return () => { if (pollingInterval) clearInterval(pollingInterval); };
  }, [pollingInterval]);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('createStripeVerificationSession', {
        profile_id: profileId || '',
        profile_type: profileType || '',
      });

      const { client_secret } = res.data;
      if (!client_secret) throw new Error('Failed to create verification session');

      // Load Stripe.js dynamically
      if (!window.Stripe) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://js.stripe.com/v3/';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const stripeKeyRes = await base44.functions.invoke('getStripeKey', {});
      const publishableKey = stripeKeyRes.data?.publishableKey || stripeKeyRes.data?.publishable_key;
      if (!publishableKey) throw new Error('Could not load Stripe configuration');

      const stripe = window.Stripe(publishableKey);

      setStatus('pending');
      setLoading(false);

      // Start polling before opening modal
      startPolling();

      const { error: stripeError } = await stripe.verifyIdentity(client_secret);

      if (stripeError) {
        if (pollingInterval) clearInterval(pollingInterval);
        if (stripeError.code === 'session_cancelled') {
          setStatus('idle');
        } else {
          setError(stripeError.message);
          setStatus('idle');
        }
      }
      // If no error, polling will pick up the result via webhook
    } catch (e) {
      setError(e.message || 'Failed to start verification. Please try again.');
      setLoading(false);
      setStatus('idle');
    }
  };

  if (status === 'verified') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Identity Verification</h3>
          </div>
        </div>
        <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-6 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-400 text-lg">Identity Verified!</p>
            <p className="text-sm text-muted-foreground">You have full access to all platform features.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Identity Verification</h3>
            <p className="text-sm text-muted-foreground">Complete the verification in the Stripe window</p>
          </div>
        </div>
        <div className="rounded-xl bg-muted/30 border border-border p-6 flex flex-col items-center gap-4 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div>
            <p className="font-semibold">Verification in progress...</p>
            <p className="text-sm text-muted-foreground mt-1">Complete the steps in the Stripe verification window. This page will update automatically.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Identity Verification</h3>
          </div>
        </div>
        <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-red-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-400">Verification Failed</p>
              <p className="text-sm text-muted-foreground">Your documents could not be verified. Please try again with a clear, valid ID document.</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setStatus('idle')}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Identity Verification</h3>
          <p className="text-sm text-muted-foreground">Powered by Stripe Identity</p>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl bg-muted/30 border border-border p-4 space-y-2">
        <p className="text-sm font-medium">What you'll need:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• A government-issued photo ID (passport, driver's licence, or national ID)</li>
          <li>• A device with a camera for a selfie</li>
          <li>• Good lighting and a clear background</li>
        </ul>
      </div>

      <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Secure & Private:</span> Your identity documents are processed by Stripe — a trusted global payments and identity platform. CoTask does not store your document images.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <Button onClick={handleVerify} disabled={loading} className="w-full" size="lg">
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting up verification...</>
        ) : (
          <><ShieldCheck className="w-4 h-4 mr-2" />Start Identity Verification<ExternalLink className="w-3 h-3 ml-1" /></>
        )}
      </Button>
    </div>
  );
}