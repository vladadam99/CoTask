import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';

/**
 * DailyVideoCall — embeds a Daily.co call using the low-level JS SDK.
 * Props:
 *   roomUrl       — Daily room URL
 *   isHost        — if true, user joins with camera/mic on
 *   onJoined      — callback when local peer joins
 *   onLeft        — callback when call ends
 *   className     — container class
 */
export default function DailyVideoCall({ roomUrl, isHost = false, onJoined, onLeft, className = '' }) {
  const containerRef = useRef(null);
  const callRef = useRef(null);
  const [status, setStatus] = useState('connecting'); // connecting | joined | error
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomUrl || !containerRef.current) return;

    const call = DailyIframe.createFrame(containerRef.current, {
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: '0',
        background: '#0a0a0f',
      },
      showLeaveButton: false,
      showFullscreenButton: false,
    });
    callRef.current = call;

    call.on('joined-meeting', () => {
      setStatus('joined');
      onJoined?.();
    });

    call.on('left-meeting', () => {
      setStatus('left');
      onLeft?.();
    });

    call.on('error', (e) => {
      setError(e?.errorMsg || 'Connection error');
      setStatus('error');
    });

    call.join({
      url: roomUrl,
      startVideoOff: !isHost,
      startAudioOff: !isHost,
    }).catch((e) => {
      setError(e?.message || 'Failed to join room');
      setStatus('error');
    });

    return () => {
      call.destroy();
    };
  }, [roomUrl]);

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      {status === 'connecting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-black/80">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Connecting to live stream…</p>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-black/80 text-center px-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}