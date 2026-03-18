import React, { useEffect, useState, useRef } from 'react';
import { Activity, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

const POLL_INTERVAL = 2000;

function getQualityLevel(fps, bitrate) {
  if (fps >= 24 && bitrate >= 800) return 'excellent';
  if (fps >= 18 && bitrate >= 400) return 'good';
  if (fps >= 10 && bitrate >= 150) return 'poor';
  return 'critical';
}

const qualityColors = {
  excellent: 'text-green-400',
  good: 'text-yellow-400',
  poor: 'text-orange-400',
  critical: 'text-red-400',
};

const qualityBg = {
  excellent: 'bg-green-500',
  good: 'bg-yellow-500',
  poor: 'bg-orange-500',
  critical: 'bg-red-500',
};

export default function StreamQualityMonitor({ streamRef, isLive }) {
  const [stats, setStats] = useState({ fps: 0, bitrate: 0, quality: 'good', dropped: 0 });
  const prevBytes = useRef(0);
  const prevTime = useRef(Date.now());
  const frameCount = useRef(0);
  const lastFrameTime = useRef(Date.now());
  const rafRef = useRef(null);
  const pollRef = useRef(null);

  // FPS counter via requestAnimationFrame
  useEffect(() => {
    if (!isLive) return;
    let count = 0;
    const tick = () => {
      count++;
      frameCount.current = count;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isLive]);

  // Poll stats every 2s
  useEffect(() => {
    if (!isLive) return;

    const poll = async () => {
      const now = Date.now();
      const elapsed = (now - prevTime.current) / 1000;

      // FPS from frame counter
      const fps = Math.round(frameCount.current / Math.max(elapsed, 0.1));
      frameCount.current = 0;
      prevTime.current = now;

      // Bitrate from MediaRecorder / track bytes (approximate via getStats if RTCPeerConnection exists)
      let bitrate = stats.bitrate;
      let dropped = stats.dropped;

      try {
        const track = streamRef.current?.getVideoTracks()?.[0];
        if (track?.getSettings) {
          const s = track.getSettings();
          // Estimate bitrate from resolution & fps (rough approximation)
          const pixels = (s.width || 1280) * (s.height || 720);
          bitrate = Math.round(pixels * fps * 0.07 / 1000); // rough kbps estimate
        }
      } catch (_) {}

      const quality = getQualityLevel(fps, bitrate);
      setStats({ fps: Math.min(fps, 60), bitrate, quality, dropped });
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [isLive, streamRef]);

  if (!isLive) return null;

  const bars = [
    stats.bitrate > 100,
    stats.bitrate > 300,
    stats.bitrate > 600,
    stats.bitrate > 900,
  ];

  return (
    <div className="glass border border-white/10 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-primary" /> Stream Quality
        </h3>
        <span className={`text-xs font-bold uppercase ${qualityColors[stats.quality]}`}>
          {stats.quality}
        </span>
      </div>

      {/* Signal bars */}
      <div className="flex items-end gap-0.5 h-5">
        {bars.map((active, i) => (
          <div
            key={i}
            className={`w-2 rounded-sm transition-colors ${active ? qualityBg[stats.quality] : 'bg-white/10'}`}
            style={{ height: `${(i + 1) * 25}%` }}
          />
        ))}
        <span className="ml-2 text-xs text-muted-foreground">{stats.bitrate} kbps</span>
      </div>

      {/* FPS */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">FPS</span>
        <span className={stats.fps < 15 ? 'text-red-400' : 'text-foreground'}>{stats.fps}</span>
      </div>

      {/* Warning */}
      {stats.quality === 'critical' && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 rounded-lg px-2 py-1.5">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          Poor connection — reconnecting may help
        </div>
      )}
    </div>
  );
}