import React, { useState, useRef, useEffect } from 'react';
import { PlayCircle, PauseCircle, RotateCcw, Download, Film } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';

export default function StreamReplay({ recordedChunks, isRecording }) {
  const [replayUrl, setReplayUrl] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  // Build replay URL whenever new chunks arrive (after recording stops)
  useEffect(() => {
    if (recordedChunks && recordedChunks.length > 0 && !isRecording) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setReplayUrl(url);
      setPlaying(false);
      setProgress(0);
      return () => URL.revokeObjectURL(url);
    }
  }, [recordedChunks, isRecording]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(v => !v);
  };

  const restart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setPlaying(true);
  };

  const download = () => {
    if (!replayUrl) return;
    const a = document.createElement('a');
    a.href = replayUrl;
    a.download = `replay-${Date.now()}.webm`;
    a.click();
  };

  const onTimeUpdate = () => {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / (videoRef.current.duration || 1)) * 100;
    setProgress(pct);
  };

  const onEnded = () => setPlaying(false);

  const seek = (e) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * videoRef.current.duration;
    setProgress(pct * 100);
  };

  return (
    <GlassCard className="p-5">
      <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Film className="w-4 h-4 text-green-400" /> Stream Replay
      </h2>

      {!replayUrl && !isRecording && (
        <p className="text-xs text-muted-foreground">Record your stream and stop recording to enable replay.</p>
      )}

      {isRecording && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Recording in progress — replay available after stopping.
        </div>
      )}

      {replayUrl && (
        <div className="space-y-3">
          {/* Video */}
          <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              src={replayUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={onTimeUpdate}
              onEnded={onEnded}
              playsInline
            />
            {!playing && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors"
              >
                <PlayCircle className="w-12 h-12 text-white/80" />
              </button>
            )}
          </div>

          {/* Progress bar */}
          <div
            className="h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden"
            onClick={seek}
          >
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="text-foreground hover:text-primary transition-colors">
              {playing
                ? <PauseCircle className="w-6 h-6" />
                : <PlayCircle className="w-6 h-6" />
              }
            </button>
            <button onClick={restart} className="text-muted-foreground hover:text-foreground transition-colors">
              <RotateCcw className="w-5 h-5" />
            </button>
            <div className="flex-1" />
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={download}>
              <Download className="w-3 h-3" /> Download
            </Button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}