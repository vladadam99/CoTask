import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Smartphone, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Simple QR code using a free API - no npm needed
const QR_API = (data) => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;

export default function QRVerification({ sessionId, onComplete }) {
  const [polling, setPolling] = useState(true);
  const [done, setDone] = useState(false);

  const mobileUrl = `${window.location.origin}/MobileVerify?session=${sessionId}`;

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      try {
        const res = await base44.functions.invoke('checkMobileVerification', { session_id: sessionId });
        if (res.data?.completed) {
          setDone(true);
          setPolling(false);
          clearInterval(interval);
          if (onComplete) onComplete(res.data.result);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [polling, sessionId]);

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-400" />
        <p className="font-semibold text-green-400">Verified on your phone!</p>
        <p className="text-sm text-muted-foreground">Identity verification completed successfully.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Smartphone className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-foreground mb-1">Scan with your phone</p>
        <p className="text-sm text-muted-foreground">Your camera isn't available on this device. Scan the QR code below with your phone to complete verification.</p>
      </div>

      <div className="p-3 bg-white rounded-2xl shadow-lg">
        <img src={QR_API(mobileUrl)} alt="QR Code" className="w-48 h-48" />
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Waiting for verification on your phone...
      </div>

      <p className="text-xs text-muted-foreground max-w-xs">
        Or open this link on your phone:{' '}
        <a href={mobileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
          {mobileUrl}
        </a>
      </p>
    </div>
  );
}