import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import {
  Camera, CameraOff, Mic, MicOff, RotateCcw, Maximize2, Minimize2,
  Smartphone, Eye, Glasses, RefreshCw, Radio, AlertCircle, ChevronDown
} from 'lucide-react';

// ─── Camera source definitions ──────────────────────────────────────────────
const SOURCES = [
  {
    id: 'phone_back',
    label: 'Phone — Rear',
    icon: Smartphone,
    mode: 'fpv',
    constraints: { video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: true },
  },
  {
    id: 'phone_front',
    label: 'Phone — Front',
    icon: Smartphone,
    mode: 'fpv',
    constraints: { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true },
  },
  {
    id: 'insta360',
    label: 'Insta360 / 360° Camera',
    icon: Eye,
    mode: 'tps360',
    constraints: { video: { width: { ideal: 3840 }, height: { ideal: 1920 } }, audio: true },
  },
  {
    id: 'meta_glasses',
    label: 'Meta Glasses (FPV)',
    icon: Glasses,
    mode: 'fpv',
    constraints: { video: { width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: true },
  },
  {
    id: 'external',
    label: 'External Camera',
    icon: Camera,
    mode: 'fpv',
    constraints: { video: true, audio: true },
  },
];

// ─── 360 gyro overlay ────────────────────────────────────────────────────────
function GyroOverlay({ active }) {
  const [angle, setAngle] = useState({ alpha: 0, beta: 0 });

  useEffect(() => {
    if (!active) return;
    const handler = (e) => setAngle({ alpha: e.alpha || 0, beta: e.beta || 0 });
    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }, [active]);

  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* crosshair */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-2 border-white/30 rounded-full" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
        <div
          className="absolute w-3 h-3 bg-primary rounded-full top-1/2 left-1/2 transition-transform duration-100"
          style={{ transform: `translate(-50%,-50%) translate(${(angle.alpha % 90 - 45) * 0.5}px, ${angle.beta * 0.3}px)` }}
        />
      </div>
      {/* heading indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 glass rounded-full px-3 py-1 text-xs text-muted-foreground">
        {Math.round(angle.alpha)}°
      </div>
    </div>
  );
}

// ─── View mode badge ─────────────────────────────────────────────────────────
function ViewBadge({ mode }) {
  const cfg = {
    fpv: { label: 'FPV — First Person', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    tps360: { label: '360° TPS', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  };
  const c = cfg[mode] || cfg.fpv;
  return (
    <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${c.color}`}>{c.label}</span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CameraStudio({ sessionTitle = 'Live Session', onEnd }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedSource, setSelectedSource] = useState(SOURCES[0]);
  const [viewMode, setViewMode] = useState('fpv'); // 'fpv' | 'tps360'
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const timerRef = useRef(null);

  // ── Enumerate real video devices and map to sources ──────────────────────
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      const vids = devices.filter(d => d.kind === 'videoinput');
      setAvailableDevices(vids);
    }).catch(() => {});
  }, []);

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (cameraOn) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [cameraOn]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Start stream ─────────────────────────────────────────────────────────────
  const startStream = useCallback(async (source, deviceId) => {
    setError(null);
    setIsConnecting(true);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      let constraints = { ...source.constraints };

      // If a specific device is chosen (Insta360, Meta Glasses identified by label)
      if (deviceId) {
        constraints.video = { deviceId: { exact: deviceId }, width: { ideal: 3840 }, height: { ideal: 1920 } };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraOn(true);
      setViewMode(source.mode || 'fpv');
    } catch (err) {
      setError(err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access.'
        : err.name === 'NotFoundError'
        ? 'Device not found. Make sure it is connected.'
        : `Could not access camera: ${err.message}`);
      setCameraOn(false);
    }
    setIsConnecting(false);
  }, []);

  // ── Stop stream ──────────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  // ── Toggle mic ───────────────────────────────────────────────────────────────
  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = !micOn; });
      setMicOn(m => !m);
    }
  };

  // ── Select source ────────────────────────────────────────────────────────────
  const selectSource = (source, deviceId) => {
    setSelectedSource(source);
    setShowSourceMenu(false);
    if (cameraOn) startStream(source, deviceId);
  };

  // ── Switch view mode (360 ↔ FPV) ─────────────────────────────────────────
  const switchView = () => {
    setViewMode(v => v === 'fpv' ? 'tps360' : 'fpv');
  };

  // ── Fullscreen ────────────────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    const el = videoRef.current?.parentElement;
    if (!fullscreen) el?.requestFullscreen?.();
    else document.exitFullscreen?.();
    setFullscreen(f => !f);
  };

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  useEffect(() => () => stopStream(), [stopStream]);

  // ── Build combined source list (SOURCES + detected real devices) ───────────
  const allSources = [
    ...SOURCES,
    ...availableDevices
      .filter(d => !SOURCES.some(s => d.label?.toLowerCase().includes(s.id)))
      .map((d, i) => ({
        id: `device_${d.deviceId}`,
        label: d.label || `Camera ${i + 1}`,
        icon: Camera,
        mode: 'fpv',
        deviceId: d.deviceId,
        constraints: { video: { deviceId: { exact: d.deviceId } }, audio: true },
      })),
  ];

  // Detect if Insta360 or Meta is physically connected
  const insta360Device = availableDevices.find(d => d.label?.toLowerCase().includes('insta') || d.label?.toLowerCase().includes('360'));
  const metaDevice = availableDevices.find(d => d.label?.toLowerCase().includes('meta') || d.label?.toLowerCase().includes('ray-ban'));

  return (
    <div className="space-y-4">
      {/* ── Video viewport ─────────────────────────────────────────────────────── */}
      <div className={`relative rounded-xl overflow-hidden bg-black ${viewMode === 'tps360' ? 'aspect-[2/1]' : 'aspect-video'}`}
        style={{ background: '#050810' }}>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-all duration-300 ${viewMode === 'tps360' ? 'object-contain' : 'object-cover'}`}
        />

        {/* No stream placeholder */}
        {!cameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Camera className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Camera not started</p>
            <p className="text-xs text-muted-foreground/60">Select a source and tap Go Live</p>
          </div>
        )}

        {/* Gyro overlay in 360 mode */}
        <GyroOverlay active={cameraOn && viewMode === 'tps360'} />

        {/* Top bar overlays */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {cameraOn && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-red-500/90 text-white text-xs font-bold px-2 py-1 rounded-full">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE {formatTime(elapsed)}
              </span>
              <ViewBadge mode={viewMode} />
            </div>
          )}
          {cameraOn && (
            <button onClick={toggleFullscreen} className="pointer-events-auto glass rounded-lg p-1.5 text-white/70 hover:text-white">
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-6">
            <div className="glass rounded-xl p-5 max-w-sm text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-300">{error}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setError(null)}>Dismiss</Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Source selector ────────────────────────────────────────────────────── */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          {/* Source picker */}
          <div className="relative">
            <button
              onClick={() => setShowSourceMenu(m => !m)}
              className="flex items-center gap-2 glass rounded-lg px-3 py-2 text-sm hover:bg-white/5 transition-colors"
            >
              <selectedSource.icon className="w-4 h-4 text-primary" />
              <span>{selectedSource.label}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
            {showSourceMenu && (
              <div className="absolute top-full left-0 mt-2 z-50 glass-strong rounded-xl p-2 min-w-56 shadow-xl border border-white/10">
                <p className="text-xs text-muted-foreground px-2 mb-2 font-semibold uppercase tracking-wide">Camera Source</p>
                {allSources.map(src => (
                  <button
                    key={src.id}
                    onClick={() => selectSource(src, src.deviceId)}
                    className={`w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors ${selectedSource.id === src.id ? 'text-primary' : ''}`}
                  >
                    <src.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{src.label}</span>
                    {(src.id === 'insta360' && insta360Device) || (src.id === 'meta_glasses' && metaDevice) ? (
                      <span className="text-xs text-green-400">Detected</span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View mode toggle */}
          <button
            onClick={switchView}
            className={`flex items-center gap-2 glass rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${viewMode === 'tps360' ? 'text-purple-300 border-purple-500/30 border' : 'text-blue-300 border-blue-500/30 border'}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Switch to {viewMode === 'fpv' ? '360° TPS' : 'FPV'}
          </button>
        </div>
      </GlassCard>

      {/* ── Controls ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Go Live / Stop */}
        {!cameraOn ? (
          <Button
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => startStream(selectedSource, selectedSource.deviceId)}
            disabled={isConnecting}
          >
            <Radio className="w-4 h-4" />
            {isConnecting ? 'Connecting…' : 'Go Live'}
          </Button>
        ) : (
          <Button variant="destructive" className="flex-1 gap-2" onClick={stopStream}>
            <CameraOff className="w-4 h-4" /> Stop Camera
          </Button>
        )}

        {/* Mic toggle */}
        <button
          onClick={toggleMic}
          disabled={!cameraOn}
          className={`glass rounded-xl p-2.5 transition-colors ${micOn ? 'text-foreground' : 'text-red-400 border border-red-500/30'} disabled:opacity-40`}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Switch camera (flip rear/front) */}
        <button
          onClick={() => {
            const next = selectedSource.id === 'phone_back' ? SOURCES[1] : SOURCES[0];
            selectSource(next);
          }}
          disabled={!cameraOn}
          className="glass rounded-xl p-2.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          title="Flip camera"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        {/* End session */}
        {onEnd && (
          <Button variant="outline" className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => { stopStream(); onEnd(); }}>
            End Session
          </Button>
        )}
      </div>

      {/* ── Device hints ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
        {[
          { icon: Smartphone, label: 'Phone Camera', desc: 'Front or rear. Tap "Flip" to switch.', available: true },
          { icon: Eye, label: 'Insta360', desc: insta360Device ? 'Detected & ready — select above' : 'Connect via USB or pair via app', available: !!insta360Device },
          { icon: Glasses, label: 'Meta Glasses', desc: metaDevice ? 'Detected & ready — select above' : 'Pair via Bluetooth / USB', available: !!metaDevice },
        ].map(d => (
          <div key={d.label} className={`glass rounded-xl p-3 flex items-start gap-3 border ${d.available ? 'border-green-500/20' : 'border-white/5'}`}>
            <d.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${d.available ? 'text-green-400' : 'text-muted-foreground'}`} />
            <div>
              <p className="text-xs font-semibold">{d.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{d.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}