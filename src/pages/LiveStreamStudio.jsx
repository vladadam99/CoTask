import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import CameraSourcePicker, { SOURCES } from '@/components/live/CameraSourcePicker';
import ViewModeToggle from '@/components/live/ViewModeToggle';
import StreamHUD from '@/components/live/StreamHUD';
import StreamViewer360 from '@/components/live/StreamViewer360';
import StreamChatbox from '@/components/live/StreamChatbox';
import { ArrowLeft, Radio, AlertTriangle, Wifi, MessageCircle, Circle, Square as StopIcon, Pen, Usb, Globe2, Lock } from 'lucide-react';
import AnnotationCanvas from '@/components/live/AnnotationCanvas';
import StreamQualityMonitor from '@/components/live/StreamQualityMonitor';
import AIStreamHighlights from '@/components/live/AIStreamHighlights';
import StreamPoll from '@/components/live/StreamPoll';
import StreamReplay from '@/components/live/StreamReplay';
import DailyVideoCall from '@/components/live/DailyVideoCall';

export default function LiveStreamStudio() {
  const { user, loading } = useCurrentUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const requestedMode = searchParams.get('mode') === 'public' ? 'public' : 'booked';

  // Stream state
  const [sessionMode, setSessionMode] = useState(requestedMode);
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
  const [dailyRoomUrl, setDailyRoomUrl] = useState(null);
  const [publicStarting, setPublicStarting] = useState(false);
  const [publicPostId, setPublicPostId] = useState(null);
  const [publicReelId, setPublicReelId] = useState(null);
  const [dailyVideoConstraints, setDailyVideoConstraints] = useState(null);

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

  const { data: avatarProfile = null } = useQuery({
    queryKey: ['stream-studio-avatar-profile', user?.email],
    queryFn: () => base44.entities.AvatarProfile.filter({ user_email: user.email }).then(r => r[0] || null),
    enabled: !!user,
  });

  useEffect(() => {
    setSessionMode(requestedMode);
  }, [requestedMode]);

  const startSessionMutation = useMutation({
    mutationFn: async ({ booking, streamMode }) => {
      const session = await base44.entities.LiveSession.create({
        booking_id: booking?.id || '',
        avatar_email: user.email,
        avatar_name: user.full_name,
        client_email: booking?.client_email || '',
        client_name: booking?.client_name || '',
        category: booking?.category || 'Quick Stream',
        title: `${booking?.category || 'Quick Stream'} — ${streamMode.toUpperCase()} session`,
        status: 'live',
        stream_mode: streamMode === '360' ? '360' : 'standard',
        started_at: new Date().toISOString(),
        session_url: booking?._dailyRoomUrl || '',
      });
      if (booking?.client_email) {
        await base44.functions.invoke('updateBookingStatus', {
          id: booking.id,
          action: 'start_session',
          payload: { session_id: session.id }
        });
      }
      return session;
    },
    onSuccess: (s) => {
      setCurrentSessionId(s.id);
      queryClient.invalidateQueries({ queryKey: ['avatar-live-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['stream-studio-bookings'] });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async (id) => {
      await base44.functions.invoke('updateLiveSession', {
        id,
        updates: {
          status: 'ended',
          ended_at: new Date().toISOString(),
          duration_minutes: Math.round(elapsed / 60),
        }
      });
      if (attachedBooking?.id) {
        await base44.functions.invoke('updateBookingStatus', {
          id: attachedBooking.id,
          action: 'complete_session'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatar-live-sessions'] });
    },
  });

  // Selected Insta360 device override
  const [insta360DeviceId, setInsta360DeviceId] = useState(null);

  // Auto-reconnection state
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimerRef = useRef(null);
  const lastSourceRef = useRef(null);

  // Insta360 USB connection state
  const [insta360Status, setInsta360Status] = useState('idle'); // idle | detecting | connected | error

  // Use a ref to avoid circular dependency between handleStreamEnded and startCamera
  const handleStreamEndedRef = useRef(null);

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
      const videoTrack = stream.getVideoTracks()[0];
      const trackSettings = videoTrack?.getSettings?.() || {};
      setDailyVideoConstraints(
        trackSettings.deviceId
          ? { deviceId: { exact: trackSettings.deviceId } }
          : source.facingMode ? { facingMode: source.facingMode } : null
      );
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setSelectedSource(source);
      setViewMode(source.mode);
      setReconnectAttempts(0);
      setReconnecting(false);
      lastSourceRef.current = { source, deviceId: overrideDeviceId || insta360DeviceId };

      // Listen for stream ending (e.g. cable unplugged) → trigger auto-reconnect
      stream.getVideoTracks().forEach(track => {
        track.addEventListener('ended', () => handleStreamEndedRef.current?.(source));
      });
    } catch (err) {
      setError(`Could not access camera: ${err.message}. Check browser permissions and that the camera is connected.`);
    }
  }, [videoDevices, insta360DeviceId]);

  // Connect Insta360 via USB (appears as a webcam device)
  const connectInsta360USB = useCallback(async () => {
    setError('');
    setInsta360Status('detecting');
    try {
      // Re-enumerate devices to get fresh list with labels
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = allDevices.filter(d => d.kind === 'videoinput');

      // Look for Insta360 by label first
      let target = cameras.find(d => {
        const l = d.label.toLowerCase();
        return l.includes('insta360') || l.includes('360') || l.includes('insta');
      });

      // Fallback: if user has more than 2 cameras, use the last non-built-in one
      if (!target && cameras.length > 2) {
        target = cameras[cameras.length - 1];
      }

      const constraints = target
        ? { video: { deviceId: { exact: target.deviceId }, width: { ideal: 3840 }, height: { ideal: 1920 } }, audio: true }
        : { video: { width: { ideal: 3840 }, height: { ideal: 1920 } }, audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const videoTrack = stream.getVideoTracks()[0];
      const trackSettings = videoTrack?.getSettings?.() || {};
      setDailyVideoConstraints(trackSettings.deviceId ? { deviceId: { exact: trackSettings.deviceId } } : null);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.src = '';
        videoRef.current.play().catch(() => {});
      }
      const src = SOURCES.find(s => s.id === 'insta360');
      setSelectedSource(src);
      setViewMode('360');
      setInsta360Status('connected');
      stream.getVideoTracks().forEach(track => {
        track.addEventListener('ended', () => handleStreamEndedRef.current?.(src));
      });
    } catch (err) {
      setInsta360Status('error');
      setError(`Insta360 not found: ${err.message}. Make sure it's connected via USB and set to "USB Camera" mode in the Insta360 app.`);
    }
  }, [videoDevices]);

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

  // Keep the ref in sync
  handleStreamEndedRef.current = handleStreamEnded;

  const disconnectInsta360 = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.src = ''; }
    setDailyVideoConstraints(null);
    setInsta360Status('idle');
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
      // Keep chunks for replay panel
      setRecordedChunks(chunks);
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

  // Start a booked client session.
  const goLive = async (booking) => {
    if (!selectedSource) { setError('Select a camera source first.'); return; }
    if (!booking?.id) { setError('Choose an accepted task before starting a live session.'); return; }
    setAttachedBooking(booking);

    // Create the Daily room from the accepted booking first, then attach it to the LiveSession record.
    try {
      const res = await base44.functions.invoke('createDailyRoom', { bookingId: booking.id });
      setDailyRoomUrl(res.data.url);
      booking._dailyRoomUrl = res.data.url;
    } catch (e) {
      setError('Failed to create video room: ' + e.message);
      return;
    }

    setIsLive(true);
    setElapsed(0);
    setChatOpen(true);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    startSessionMutation.mutate({ booking, streamMode: viewMode });
  };

  const startPublicLive = async () => {
    if (!selectedSource) { setError('Select a camera source first.'); return; }
    setPublicStarting(true);
    setError('');
    setAttachedBooking(null);

    try {
      const avatarName = avatarProfile?.display_name || user.full_name || 'Local Agent';
      const avatarPhoto = avatarProfile?.photo_url || user.photo_url || '';
      const session = await base44.entities.LiveSession.create({
        booking_id: '',
        avatar_email: user.email,
        avatar_name: avatarName,
        client_email: 'public',
        client_name: 'Public audience',
        category: 'Public Live',
        title: `${avatarName} is live now`,
        status: 'live',
        stream_mode: viewMode === '360' ? '360' : 'standard',
        started_at: new Date().toISOString(),
      });

      const res = await base44.functions.invoke('createDailyRoom', { sessionId: session.id });
      const roomUrl = res.data.url;
      const caption = `${avatarName} is live now on CoTask.`;
      const thumbnail = avatarPhoto || '';

      const post = await base44.entities.Post.create({
        avatar_email: user.email,
        avatar_name: avatarName,
        avatar_photo_url: avatarPhoto,
        avatar_profile_id: avatarProfile?.id || '',
        type: 'video',
        media_url: thumbnail || roomUrl,
        thumbnail_url: thumbnail,
        caption,
        category: 'Live',
        is_published: true,
        is_live: true,
        live_status: 'live',
        live_url: roomUrl,
        live_session_id: session.id,
      });

      const reel = await base44.entities.Reel.create({
        avatar_email: user.email,
        avatar_name: avatarName,
        avatar_photo_url: avatarPhoto,
        title: `${avatarName} is live`,
        description: caption,
        category: 'Live',
        thumbnail_url: thumbnail,
        video_url: roomUrl,
        is_published: true,
        is_live: true,
        live_status: 'live',
        live_url: roomUrl,
        live_session_id: session.id,
        live_post_id: post.id,
      });

      setCurrentSessionId(session.id);
      setDailyRoomUrl(roomUrl);
      setPublicPostId(post.id);
      setPublicReelId(reel.id);
      setIsLive(true);
      setElapsed(0);
      setChatOpen(false);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      queryClient.invalidateQueries({ queryKey: ['explore-recent-posts'] });
      queryClient.invalidateQueries({ queryKey: ['reels-feed'] });
      queryClient.invalidateQueries({ queryKey: ['avatar-live-sessions'] });
    } catch (e) {
      setError('Failed to start public live: ' + (e?.message || 'Unknown error'));
    } finally {
      setPublicStarting(false);
    }
  };

  // End session
  const endSession = async () => {
    if (isRecording) stopRecording();
    setIsLive(false);
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    try {
      if (currentSessionId) await endSessionMutation.mutateAsync(currentSessionId);
      if (publicPostId) await base44.entities.Post.update(publicPostId, { is_live: true, live_status: 'ended', live_url: '' });
      if (publicReelId) await base44.entities.Reel.update(publicReelId, { is_live: true, live_status: 'ended', live_url: '' });
    } catch (_) {
      // The session has already stopped locally; failed status updates can be retried from history.
    }
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
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
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
                onSelect={(source) => {
                  // For Insta360: just select it and show connection options — don't auto-start camera
                  if (source.id === 'insta360') {
                    setSelectedSource(source);
                    setViewMode('360');
                    setError('');
                  } else {
                    startCamera(source);
                  }
                }}
                availableSources={availableSources.length ? availableSources : ['phone-front', 'phone-rear', 'insta360', 'meta-glasses']}
              />
            </GlassCard>

            {/* Insta360 USB Connect Panel */}
            {selectedSource?.id === 'insta360' && (
              <GlassCard className="p-5">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Usb className="w-4 h-4 text-purple-400" /> Insta360 USB Connect
                </h2>
                {insta360Status === 'connected' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Insta360 connected via USB
                    </div>
                    <Button size="sm" variant="outline" className="w-full text-xs text-red-400 border-red-500/20 hover:bg-red-500/10" onClick={disconnectInsta360}>
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Step 1:</strong> Plug the Insta360 into your phone via USB.<br/>
                      <strong className="text-foreground">Step 2:</strong> In the Insta360 app → Settings → set USB mode to <span className="text-purple-300 font-medium">"UVC Camera"</span>.<br/>
                      <strong className="text-foreground">Step 3:</strong> Tap Connect below.
                    </p>
                    {insta360Status === 'error' && (
                      <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">Camera not detected. Check USB mode setting.</p>
                    )}
                    <Button
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
                      onClick={connectInsta360USB}
                      disabled={insta360Status === 'detecting'}
                    >
                      {insta360Status === 'detecting'
                        ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Detecting…</>
                        : <><Usb className="w-3 h-3" /> Connect Insta360</>
                      }
                    </Button>
                  </div>
                )}
              </GlassCard>
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



            {/* View mode */}
            {selectedSource && (
              <GlassCard className="p-5">
                <h2 className="text-sm font-semibold mb-3">View Mode</h2>
                <ViewModeToggle mode={viewMode} onChange={setViewMode} available={availableViewModes} />
                <p className="text-xs text-muted-foreground mt-3">
                  {viewMode === 'fpv' && 'First Person View — client sees exactly what the Local Agent sees.'}
                  {viewMode === 'tps' && 'Third Person / Wide — rear camera, environment framing.'}
                  {viewMode === '360' && '360° Sphere — client can drag to look anywhere around you.'}
                </p>
              </GlassCard>
            )}

            {!isLive && (
              <GlassCard className="p-5">
                <h2 className="text-sm font-semibold mb-3">Live mode</h2>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSessionMode('booked')}
                    className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                      sessionMode === 'booked'
                        ? 'border-primary/50 bg-primary/10 text-foreground'
                        : 'border-border bg-background/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Lock className="mb-2 h-4 w-4" />
                    <span className="block text-sm font-semibold">Booked task</span>
                    <span className="mt-1 block text-[11px] leading-snug">Private client session in conversation.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionMode('public')}
                    className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                      sessionMode === 'public'
                        ? 'border-primary/50 bg-primary/10 text-foreground'
                        : 'border-border bg-background/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Globe2 className="mb-2 h-4 w-4" />
                    <span className="block text-sm font-semibold">Public live</span>
                    <span className="mt-1 block text-[11px] leading-snug">Visible in Reels and Explore.</span>
                  </button>
                </div>
              </GlassCard>
            )}

            {/* Booking to attach / Session start */}
            {!isLive && sessionMode === 'booked' && (
              <GlassCard className="p-5">
                <div className="mb-4 space-y-1">
                  <h2 className="text-sm font-semibold">Start client session</h2>
                  <p className="text-xs text-muted-foreground">
                    Live video starts from an accepted task. Use preview here to test your camera before the appointment.
                  </p>
                </div>
                <div className="space-y-3">
                  {readyBookings.length > 0 ? (
                    <div className="space-y-2">
                      {readyBookings.map(b => (
                        <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/40 p-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{b.category}</p>
                            <p className="text-xs text-muted-foreground truncate">{b.client_name || 'Client task'}</p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 shrink-0 gap-1"
                            onClick={() => goLive(b)}
                            disabled={!selectedSource || startSessionMutation.isPending}
                          >
                            <Radio className="w-3 h-3" /> Start session
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/80 bg-background/30 p-4">
                      <p className="text-sm font-medium">No accepted task is ready</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        You can test the camera preview here, but live client calls should start from a confirmed task.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => navigate('/AvatarRequests')}
                      >
                        View requests
                      </Button>
                    </div>
                  )}
                  {!selectedSource && (
                    <p className="text-xs text-muted-foreground">
                      Select a camera source first. Nothing broadcasts during preview.
                    </p>
                  )}
                </div>
              </GlassCard>
            )}

            {!isLive && sessionMode === 'public' && (
              <GlassCard className="p-5">
                <div className="mb-4 space-y-1">
                  <h2 className="text-sm font-semibold">Start public live</h2>
                  <p className="text-xs text-muted-foreground">
                    Public live creates a live post and reel so anyone browsing CoTask can watch.
                  </p>
                </div>
                <Button
                  className="w-full gap-2 bg-red-600 hover:bg-red-700"
                  onClick={startPublicLive}
                  disabled={!selectedSource || publicStarting}
                >
                  {publicStarting ? (
                    <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Starting...</>
                  ) : (
                    <><Globe2 className="w-4 h-4" /> Go public live</>
                  )}
                </Button>
                {!selectedSource && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Select a camera source first. Preview is private until you start public live.
                  </p>
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
              {isLive && dailyRoomUrl ? (
                /* Live WebRTC call via Daily.co */
                <DailyVideoCall
                  roomUrl={dailyRoomUrl}
                  isHost={true}
                  videoConstraints={dailyVideoConstraints}
                  className="w-full h-full"
                />
              ) : !selectedSource ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-8">
                  <Wifi className="w-12 h-12 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">Select a camera source to begin preview</p>
                  <p className="text-xs text-muted-foreground/60">Phone · Insta360 · Meta Glasses</p>
                </div>
              ) : selectedSource.id === 'insta360' && insta360Status !== 'connected' ? (
                /* Insta360 selected but not yet connected — show USB prompt */
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                    <Usb className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-foreground text-sm font-semibold">Connect your Insta360 via USB</p>
                  <ol className="text-xs text-muted-foreground text-left space-y-1.5 max-w-xs">
                    <li><span className="text-foreground font-medium">1.</span> Plug Insta360 into your phone via USB</li>
                    <li><span className="text-foreground font-medium">2.</span> Open the Insta360 app → Settings → USB Mode → <span className="text-purple-300">UVC Camera</span></li>
                    <li><span className="text-foreground font-medium">3.</span> Tap the button below</li>
                  </ol>
                  <button
                    onClick={connectInsta360USB}
                    disabled={insta360Status === 'detecting'}
                    className="flex items-center justify-center gap-2 text-sm bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60"
                  >
                    {insta360Status === 'detecting'
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Detecting…</>
                      : <><Usb className="w-4 h-4" /> Connect Insta360</>
                    }
                  </button>
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
                        <span className="glass text-xs text-white px-2.5 py-1 rounded-md font-medium border border-border">
                          {selectedSource.label}
                        </span>
                      )}
                      <span className="glass text-xs text-white px-2.5 py-1 rounded-md font-medium border border-border uppercase">
                        {viewMode}
                      </span>
                    </div>
                    {!isLive && (
                      <span className="text-xs text-muted-foreground glass px-2.5 py-1 rounded-md border border-border">Preview</span>
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
            {selectedSource && !isLive && (insta360Status === 'connected' || (selectedSource.id !== 'insta360' && streamRef.current)) && (
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground px-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                Camera preview active - not broadcasting yet. Choose booked or public live when ready.
              </div>
            )}
            {isLive && (
              <div className="mt-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-3 text-xs text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  {publicPostId ? (
                    <>
                      Public live is visible in Reels and Explore.
                      <button
                        onClick={() => navigate(`/PublicLiveView?post=${publicPostId}`)}
                        className="font-semibold underline underline-offset-2"
                      >
                        View public page
                      </button>
                    </>
                  ) : (
                    'You are live. Your client can join from the conversation.'
                  )}
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
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors border ${annotationsOn ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}
                  >
                    <Pen className="w-3 h-3" /> Annotate
                  </button>
                  {attachedBooking?.id && (
                    <button
                      onClick={() => setChatOpen(v => !v)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors border ${chatOpen ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}
                    >
                      <MessageCircle className="w-3 h-3" /> Chat
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CHAT PANEL */}
          {chatOpen && isLive && (
            <div className="lg:col-span-1" style={{ height: '560px' }}>
              <StreamChatbox
                clientName={attachedBooking?.client_name || 'Audience'}
                avatarName={user?.full_name || 'You'}
                bookingId={attachedBooking?.id}
                senderRole="avatar"
                notifyTargetRole={attachedBooking?.client_type === 'enterprise' ? 'enterprise' : 'user'}
                isOpen={chatOpen}
                onClose={() => setChatOpen(false)}
              />
            </div>
          )}
        </div>

        {/* Feature panels — AI Highlights, Poll, Replay */}
        <div className="grid gap-5 mt-6 lg:grid-cols-3">
          <AIStreamHighlights
            isLive={isLive}
            elapsed={elapsed}
            attachedBooking={attachedBooking}
            streamMode={viewMode}
          />
          <StreamPoll isLive={isLive} />
          <StreamReplay recordedChunks={recordedChunks} isRecording={isRecording} />
        </div>

        {/* Notes */}
        <GlassCard className="p-5 mt-6 border-border">
          <h3 className="text-sm font-semibold mb-2">Device Connection Tips</h3>
          <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed list-disc list-inside">
            <li><strong className="text-foreground">Phone cameras</strong> — detected automatically. Grant camera permission when prompted.</li>
            <li><strong className="text-foreground">Insta360 via USB</strong> — plug in via USB cable, open the Insta360 app, go to <span className="text-purple-300">Settings → USB Mode → UVC Camera</span>, then tap "Connect Insta360" in the panel.</li>
            <li><strong className="text-foreground">UVC mode required</strong> — without UVC mode the camera won't be visible to the browser. This setting is per-session; you may need to re-enable it each time you open the Insta360 app.</li>
            <li><strong className="text-foreground">360° view</strong> — automatically enabled when Insta360 is connected. Client can drag to look in any direction.</li>
            <li><strong className="text-foreground">Meta Glasses</strong> — connect via USB and allow camera access when the browser prompts.</li>
          </ul>
        </GlassCard>

      </div>
    </div>
  );
}
