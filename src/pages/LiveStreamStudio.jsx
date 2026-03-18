import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Link, useNavigate } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import CameraSourcePicker, { SOURCES } from '@/components/live/CameraSourcePicker';
import ViewModeToggle from '@/components/live/ViewModeToggle';
import StreamHUD from '@/components/live/StreamHUD';
import StreamViewer360 from '@/components/live/StreamViewer360';
import StreamChatbox from '@/components/live/StreamChatbox';
import { ArrowLeft, Radio, AlertTriangle, Wifi, MessageCircle, Circle, Square as StopIcon, Pen, WifiOff } from 'lucide-react';
import AnnotationCanvas from '@/components/live/AnnotationCanvas';
import StreamQualityMonitor from '@/components/live/StreamQualityMonitor';
import MultiCameraSwitcher from '@/components/live/MultiCameraSwitcher';

export default function LiveStreamStudio() {
  const { user, loading } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Stream state
  const [selectedSource, setSelectedSource] = useState(null);
  const [viewMode, setViewMode] = useState('fpv'); // fpv | tps | 360
  const [isLive, setIsLive] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [availableSources, setAvailableSources] = useState([]);
  const [error, setError] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [attachedBooking, setAttachedBooking] = useState(null);
  const [annotationsOn, setAnnotationsOn] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // Device list for picker (label + deviceId)
  const [videoDevices, setVideoDevices] = useState([]);

  // Detect available cameras — request permission first so labels are populated
  useEffect(() => {
    const detect = async () => {
      try {
        // Request permission first so Android populates device labels
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tempStream.getTracks().forEach(t => t.stop());
      } catch (_) { /* ignore — enumerateDevices still works without labels */ }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const vids = devices.filter(d => d.kind === 'videoinput');
        setVideoDevices(vids);

        const next = ['phone-front', 'phone-rear'];
        // Always make insta360 selectable so user can use Wi-Fi wireless mode
        next.push('insta360');
        vids.forEach(d => {
          const label = d.label.toLowerCase();
          if (label.includes('insta360') || label.includes('360') || label.includes('usb') || label.includes('insta')) {
            next.push('insta360');
          }
          if (label.includes('meta') || label.includes('glasses') || label.includes('oculus')) {
            next.push('meta-glasses');
          }
        });
        // If there are extra video devices beyond phone's built-in, mark all special sources available
        if (vids.length > 1) {
          next.push('insta360', 'meta-glasses');
        }
        setAvailableSources([...new Set(next)]);
      } catch (_) {
        setAvailableSources(['phone-front', 'phone-rear', 'insta360', 'meta-glasses']);
      }
    };
    detect();
  }, []);

  // Ready bookings
  const { data: readyBookings = [] } = useQuery({
    queryKey: ['stream-studio-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ avatar_email: user.email, status: 'accepted' }, '-scheduled_date', 10),
    enabled: !!user,
  });

  const startSessionMutation = useMutation({
    mutationFn: ({ booking, streamMode }) => base44.entities.LiveSession.create({
      booking_id: booking.id,
      avatar_email: user.email,
      avatar_name: user.full_name,
      client_email: booking.client_email,
      client_name: booking.client_name,
      category: booking.category,
      title: `${booking.category} — ${streamMode.toUpperCase()} session`,
      status: 'live',
      stream_mode: streamMode === '360' ? '360' : 'standard',
      started_at: new Date().toISOString(),
    }),
    onSuccess: (s) => {
      setCurrentSessionId(s.id);
      queryClient.invalidateQueries({ queryKey: ['avatar-live-sessions'] });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: (id) => base44.entities.LiveSession.update(id, {
      status: 'ended',
      ended_at: new Date().toISOString(),
      duration_minutes: Math.round(elapsed / 60),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatar-live-sessions'] });
    },
  });

  // Selected Insta360 device override
  const [insta360DeviceId, setInsta360DeviceId] = useState(null);

  // Active device ID for multi-camera switcher
  const [activeDeviceId, setActiveDeviceId] = useState(null);

  // Auto-reconnection state
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimerRef = useRef(null);
  const lastSourceRef = useRef(null);

  // Wireless / Wi-Fi stream state
  const [wifiStreamUrl, setWifiStreamUrl] = useState('');
  const [wifiStreamActive, setWifiStreamActive] = useState(false);
  const [wifiConnecting, setWifiConnecting] = useState(false);

  // Start camera stream
  const startCamera = useCallback(async (source, overrideDeviceId = null) => {
    setError('');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      let videoConstraints;

      if (source.id === 'insta360' || source.id === 'meta-glasses') {
        // Try to find the exact device by label first
        const matchedDevice = videoDevices.find(d => {
          const label = d.label.toLowerCase();
          if (source.id === 'insta360') return label.includes('insta360') || label.includes('360') || label.includes('usb') || label.includes('insta');
          if (source.id === 'meta-glasses') return label.includes('meta') || label.includes('glasses') || label.includes('oculus');
          return false;
        });
        const deviceId = overrideDeviceId || insta360DeviceId || matchedDevice?.deviceId;
        if (deviceId) {
          videoConstraints = { deviceId: { exact: deviceId }, width: { ideal: 3840 }, height: { ideal: 1920 } };
        } else {
          // Fallback: pick the last video device (most likely the USB/external one on Android)
          const lastDevice = videoDevices[videoDevices.length - 1];
          videoConstraints = lastDevice
            ? { deviceId: { exact: lastDevice.deviceId }, width: { ideal: 3840 }, height: { ideal: 1920 } }
            : { facingMode: source.facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } };
        }
      } else {
        // Phone front/rear — use facingMode
        videoConstraints = {
          facingMode: source.facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setSelectedSource(source);
      setViewMode(source.mode);
      setReconnectAttempts(0);
      setReconnecting(false);
      // Track active device for multi-camera switcher
      const deviceId = videoConstraints.deviceId?.exact || null;
      setActiveDeviceId(deviceId);
      lastSourceRef.current = { source, deviceId: overrideDeviceId || insta360DeviceId };

      // Listen for stream ending (e.g. cable unplugged) → trigger auto-reconnect
      stream.getVideoTracks().forEach(track => {
        track.addEventListener('ended', () => handleStreamEnded(source));
      });
    } catch (err) {
      setError(`Could not access camera: ${err.message}. Check browser permissions and that the camera is connected.`);
    }
  }, [videoDevices, insta360DeviceId]);

  // Connect Insta360 via Wi-Fi (HTTP stream from camera's hotspot)
  const connectWifiStream = useCallback(async (customUrl = null) => {
    setError('');
    setWifiConnecting(true);

    // Insta360 cameras broadcast a preview stream over their Wi-Fi hotspot.
    // Common endpoints: http://192.168.42.1:8080/stream (X3, ONE RS, ONE X2)
    // User can also enter any MJPEG/HTTP stream URL.
    const url = customUrl || wifiStreamUrl || 'http://192.168.42.1:8080/stream';

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    try {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
        videoRef.current.crossOrigin = 'anonymous';
        await videoRef.current.play();
        setWifiStreamActive(true);
        setWifiStreamUrl(url);
        setSelectedSource(SOURCES.find(s => s.id === 'insta360'));
        setViewMode('360');
      }
    } catch (err) {
      // MJPEG streams don't trigger play() correctly — set src and let browser handle it
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.load();
        setWifiStreamActive(true);
        setWifiStreamUrl(url);
        setSelectedSource(SOURCES.find(s => s.id === 'insta360'));
        setViewMode('360');
      }
    } finally {
      setWifiConnecting(false);
    }
  }, [wifiStreamUrl]);

  // Auto-reconnection: called when a stream track ends unexpectedly
  const handleStreamEnded = useCallback((source) => {
    if (!isLive) return;
    setReconnecting(true);
    setError('');

    let attempts = 0;
    const MAX_ATTEMPTS = 5;
    const RETRY_DELAY = 3000;

    const tryReconnect = async () => {
      if (attempts >= MAX_ATTEMPTS) {
        setReconnecting(false);
        setError('Auto-reconnect failed after 5 attempts. Please re-select your camera manually.');
        return;
      }
      attempts++;
      setReconnectAttempts(attempts);
      try {
        await startCamera(source, lastSourceRef.current?.deviceId || null);
        setReconnecting(false);
        setReconnectAttempts(0);
      } catch (_) {
        reconnectTimerRef.current = setTimeout(tryReconnect, RETRY_DELAY);
      }
    };

    reconnectTimerRef.current = setTimeout(tryReconnect, RETRY_DELAY);
  }, [isLive, startCamera]);

  // Multi-camera hot-switch: switch active device without stopping the session
  const switchCamera = useCallback(async (deviceId) => {
    if (!selectedSource) return;
    setActiveDeviceId(deviceId);
    setInsta360DeviceId(deviceId);
    await startCamera(selectedSource, deviceId);
  }, [selectedSource, startCamera]);

  const disconnectWifiStream = () => {
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.srcObject = null;
    }
    setWifiStreamActive(false);
    setSelectedSource(null);
  };

  // Toggle mic/cam tracks
  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(v => !v);
  };
  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOn(v => !v);
  };

  // Recording
  const startRecording = () => {
    if (!streamRef.current) return;
    const chunks = [];
    const startTime = Date.now();
    // Pick best supported codec — Android Chrome often only supports vp8 or baseline webm
    const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';
    const mr = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {});
    mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      // Download locally
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stream-recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      // Also save to Recording Library
      saveRecordingToDB(blob, durationSeconds);
      setRecordedChunks([]);
    };
    mediaRecorderRef.current = mr;
    mr.start(1000);
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const saveRecordingToDB = async (blob, durationSeconds) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
      await base44.entities.Recording.create({
        avatar_email: user.email,
        client_name: attachedBooking?.client_name || '',
        session_id: currentSessionId || '',
        booking_id: attachedBooking?.id || '',
        title: `${attachedBooking?.category || 'Session'} — ${new Date().toLocaleDateString()}`,
        category: attachedBooking?.category || '',
        duration_seconds: durationSeconds,
        file_url,
        stream_mode: viewMode === '360' ? '360' : 'standard',
        file_size_mb: Math.round(blob.size / 1024 / 1024 * 10) / 10,
      });
    } catch (_) { /* silent — download fallback still works */ }
  };

  // Go live
  const goLive = (booking) => {
    if (!selectedSource) { setError('Select a camera source first.'); return; }
    setAttachedBooking(booking);
    setIsLive(true);
    setElapsed(0);
    setChatOpen(true);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    startSessionMutation.mutate({ booking, streamMode: viewMode });
  };

  // End session
  const endSession = () => {
    if (isRecording) stopRecording();
    setIsLive(false);
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (currentSessionId) endSessionMutation.mutate(currentSessionId);
    navigate('/AvatarLive');
  };

  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearTimeout(reconnectTimerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const availableViewModes = selectedSource
    ? selectedSource.id === 'insta360' ? ['fpv', 'tps', '360']
    : selectedSource.id === 'meta-glasses' ? ['fpv']
    : ['fpv', 'tps']
    : [];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen pb-16 px-4 lg:px-8">
      <div className="max-w-6xl mx-auto pt-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/AvatarLive" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" /> Live Stream Studio
          </h1>
          <div className="w-16" />
        </div>

        <div className={`grid gap-6 ${chatOpen && isLive ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>

          {/* LEFT — Controls */}
          <div className="space-y-5">

            {/* Camera source */}
            <GlassCard className="p-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" /> Camera Source
              </h2>
              <CameraSourcePicker
                selected={selectedSource}
                onSelect={startCamera}
                availableSources={availableSources.length ? availableSources : ['phone-front', 'phone-rear', 'insta360', 'meta-glasses']}
              />
            </GlassCard>

            {/* Insta360 device selector — shown when insta360 is selected and multiple devices exist */}
            {selectedSource?.id === 'insta360' && videoDevices.length > 1 && (
              <GlassCard className="p-5">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" /> Select Insta360 Device
                </h2>
                <p className="text-xs text-muted-foreground mb-3">Pick the device that corresponds to your Insta360 camera, or use the Wi-Fi panel below:</p>
                <div className="space-y-2">
                  {videoDevices.map((d, i) => (
                    <button
                      key={d.deviceId}
                      onClick={() => { setInsta360DeviceId(d.deviceId); startCamera(selectedSource, d.deviceId); }}
                      className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                        insta360DeviceId === d.deviceId
                          ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                          : 'bg-card/40 border-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground'
                      }`}
                    >
                      <span className="font-medium">{d.label || `Camera ${i + 1}`}</span>
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Multi-Camera Switcher */}
            {videoDevices.length > 1 && (
              <MultiCameraSwitcher
                videoDevices={videoDevices}
                activeDeviceId={activeDeviceId}
                onSwitch={switchCamera}
              />
            )}

            {/* Auto-reconnect status */}
            {reconnecting && (
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-400">
                <span className="w-3 h-3 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin shrink-0" />
                Reconnecting camera… attempt {reconnectAttempts}/5
              </div>
            )}

            {/* Stream Quality Monitor */}
            <StreamQualityMonitor streamRef={streamRef} isLive={isLive} />

            {/* Insta360 Wi-Fi Wireless Connect */}
            {selectedSource?.id === 'insta360' && (
              <GlassCard className="p-5">
                <h2 className="text-sm font-semibold mb-1 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-purple-400" /> Wi-Fi Wireless Connect
                </h2>
                <p className="text-xs text-muted-foreground mb-3">
                  Connect your Android phone to the <strong className="text-foreground">Insta360 Wi-Fi hotspot</strong>, then tap Connect. No USB needed.
                </p>
                {!wifiStreamActive ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={wifiStreamUrl}
                      onChange={e => setWifiStreamUrl(e.target.value)}
                      placeholder="http://192.168.42.1:8080/stream"
                      className="w-full text-xs bg-card/60 border border-white/10 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50"
                    />
                    <p className="text-xs text-muted-foreground/60">Default: 192.168.42.1:8080 (X3 / ONE RS / ONE X2)</p>
                    <Button
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
                      onClick={() => connectWifiStream()}
                      disabled={wifiConnecting}
                    >
                      {wifiConnecting ? (
                        <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connecting…</>
                      ) : (
                        <><Wifi className="w-3 h-3" /> Connect via Wi-Fi</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 text-xs"
                      onClick={() => connectWifiStream('http://192.168.42.1:8080/stream')}
                    >
                      Try default address
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Connected wirelessly to Insta360
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{wifiStreamUrl}</p>
                    <Button size="sm" variant="outline" className="w-full gap-2 text-xs text-red-400 border-red-500/20 hover:bg-red-500/10" onClick={disconnectWifiStream}>
                      <WifiOff className="w-3 h-3" /> Disconnect
                    </Button>
                  </div>
                )}
              </GlassCard>
            )}

            {/* View mode */}
            {selectedSource && (
              <GlassCard className="p-5">
                <h2 className="text-sm font-semibold mb-3">View Mode</h2>
                <ViewModeToggle mode={viewMode} onChange={setViewMode} available={availableViewModes} />
                <p className="text-xs text-muted-foreground mt-3">
                  {viewMode === 'fpv' && 'First Person View — client sees exactly what the avatar sees.'}
                  {viewMode === 'tps' && 'Third Person / Wide — rear camera, environment framing.'}
                  {viewMode === '360' && '360° Sphere — client can drag to look anywhere around you.'}
                </p>
              </GlassCard>
            )}

            {/* Booking to attach */}
            {!isLive && (
              <GlassCard className="p-5">
                <h2 className="text-sm font-semibold mb-3">Attach Booking</h2>
                {readyBookings.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No accepted bookings. Accept a request first.</p>
                ) : (
                  <div className="space-y-2">
                    {readyBookings.map(b => (
                      <div key={b.id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{b.category}</p>
                          <p className="text-xs text-muted-foreground">{b.client_name}</p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 shrink-0 gap-1"
                          onClick={() => goLive(b)}
                          disabled={!selectedSource || startSessionMutation.isPending}
                        >
                          <Radio className="w-3 h-3" /> Go Live
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* RIGHT — Video Preview */}
          <div className={chatOpen && isLive ? 'lg:col-span-2' : 'lg:col-span-2'}>
            <GlassCard className="p-0 overflow-hidden relative" style={{ height: '520px' }}>
              {!selectedSource ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-8">
                  <Wifi className="w-12 h-12 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">Select a camera source to begin preview</p>
                  <p className="text-xs text-muted-foreground/60">Phone · Insta360 · Meta Glasses</p>
                </div>
              ) : viewMode === '360' ? (
                <StreamViewer360 videoRef={videoRef} />
              ) : (
                /* Standard FPV / TPS — raw video element */
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: selectedSource?.id === 'phone-front' ? 'scaleX(-1)' : 'none' }}
                />
              )}

              {/* HUD overlay — only when source selected */}
              {selectedSource && (
                <>
                  {/* Top bar */}
                  <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
                    <div className="flex items-center gap-2">
                      {selectedSource && (
                        <span className="glass text-xs text-white px-2.5 py-1 rounded-md font-medium border border-white/10">
                          {selectedSource.label}
                        </span>
                      )}
                      <span className="glass text-xs text-white px-2.5 py-1 rounded-md font-medium border border-white/10 uppercase">
                        {viewMode}
                      </span>
                    </div>
                    {!isLive && (
                      <span className="text-xs text-muted-foreground glass px-2.5 py-1 rounded-md border border-white/5">Preview</span>
                    )}
                  </div>

                  {/* Annotation canvas overlay */}
                  {annotationsOn && isLive && <AnnotationCanvas />}

                  {/* HUD bottom */}
                  {isLive && (
                    <StreamHUD
                      isLive={isLive}
                      micOn={micOn}
                      camOn={camOn}
                      elapsed={elapsed}
                      viewerCount={1}
                      onToggleMic={toggleMic}
                      onToggleCam={toggleCam}
                      onEnd={endSession}
                    />
                  )}

                  {/* View mode quick-switch overlay (top right, only when live) */}
                  {isLive && availableViewModes.length > 1 && (
                    <div className="absolute top-4 right-4">
                      <ViewModeToggle mode={viewMode} onChange={setViewMode} available={availableViewModes} />
                    </div>
                  )}
                </>
              )}
            </GlassCard>

            {/* Info bar below video */}
            {selectedSource && !isLive && (
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground px-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                Camera preview active — not broadcasting yet. Select a booking above to go live.
              </div>
            )}
            {isLive && (
              <div className="mt-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-3 text-xs text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  You are live. Your client can view this stream in real time.
                </div>
                <div className="flex items-center gap-2">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-1.5 text-xs bg-red-600/90 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Circle className="w-3 h-3 fill-white" /> Record
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-1.5 text-xs bg-red-700 text-white px-3 py-1.5 rounded-lg animate-pulse"
                    >
                      <StopIcon className="w-3 h-3 fill-white" /> Stop & Save
                    </button>
                  )}
                  <button
                    onClick={() => setAnnotationsOn(v => !v)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors border ${annotationsOn ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' : 'bg-secondary border-white/10 text-muted-foreground hover:text-foreground'}`}
                  >
                    <Pen className="w-3 h-3" /> Annotate
                  </button>
                  <button
                    onClick={() => setChatOpen(v => !v)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors border ${chatOpen ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-secondary border-white/10 text-muted-foreground hover:text-foreground'}`}
                  >
                    <MessageCircle className="w-3 h-3" /> Chat
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CHAT PANEL */}
          {chatOpen && isLive && (
            <div className="lg:col-span-1" style={{ height: '560px' }}>
              <StreamChatbox
                clientName={attachedBooking?.client_name || 'Client'}
                avatarName={user?.full_name || 'You'}
                isOpen={chatOpen}
                onClose={() => setChatOpen(false)}
              />
            </div>
          )}
        </div>

        {/* Notes */}
        <GlassCard className="p-5 mt-6 border-white/5">
          <h3 className="text-sm font-semibold mb-2">Device Connection Tips</h3>
          <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed list-disc list-inside">
            <li><strong className="text-foreground">Phone cameras</strong> — detected automatically. Grant camera permission when prompted.</li>
            <li><strong className="text-foreground">Insta360 Wi-Fi (recommended)</strong> — on your Insta360, enable Wi-Fi hotspot mode. On your Android, join that Wi-Fi network. Then select "Insta360" above and tap "Connect via Wi-Fi". No cable needed.</li>
            <li><strong className="text-foreground">Default stream address</strong> — most Insta360 models (X3, ONE RS, ONE X2) use <code className="text-purple-300">192.168.42.1:8080</code>. If yours differs, enter the correct IP in the Wi-Fi panel.</li>
            <li><strong className="text-foreground">Insta360 hotspot name</strong> — usually starts with "Insta360" followed by the model. Password is on the camera label or in the Insta360 app settings.</li>
            <li><strong className="text-foreground">360° view</strong> — automatically enabled when Insta360 is connected. Client can drag to look in any direction.</li>
            <li><strong className="text-foreground">Meta Glasses</strong> — connect via USB tethering or use their companion Wi-Fi mode.</li>
          </ul>
        </GlassCard>

      </div>
    </div>
  );
}