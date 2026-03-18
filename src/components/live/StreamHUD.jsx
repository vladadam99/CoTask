import React from 'react';
import { Mic, MicOff, VideoOff, Video, Square, Users, Clock, Signal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StreamHUD({
  isLive,
  micOn,
  camOn,
  elapsed,
  viewerCount = 1,
  onToggleMic,
  onToggleCam,
  onEnd,
}) {
  const fmt = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none">
      {/* Left — live badge + timer */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {isLive && (
          <div className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </div>
        )}
        <div className="flex items-center gap-1.5 glass rounded-md px-2.5 py-1 text-xs font-mono font-semibold text-white">
          <Clock className="w-3.5 h-3.5" />
          {fmt(elapsed)}
        </div>
        <div className="flex items-center gap-1.5 glass rounded-md px-2.5 py-1 text-xs text-white">
          <Users className="w-3.5 h-3.5" />
          {viewerCount}
        </div>
        <div className="flex items-center gap-1.5 glass rounded-md px-2.5 py-1 text-xs text-green-400">
          <Signal className="w-3.5 h-3.5" />
          Connected
        </div>
      </div>

      {/* Right — controls */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onToggleMic}
          className={`p-2.5 rounded-xl border transition-all ${micOn ? 'bg-white/10 border-white/20 text-white' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}
        >
          {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>
        <button
          onClick={onToggleCam}
          className={`p-2.5 rounded-xl border transition-all ${camOn ? 'bg-white/10 border-white/20 text-white' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}
        >
          {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </button>
        <button
          onClick={onEnd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors border border-red-500"
        >
          <Square className="w-3.5 h-3.5" /> End
        </button>
      </div>
    </div>
  );
}