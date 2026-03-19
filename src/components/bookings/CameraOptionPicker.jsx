import React from 'react';
import { Video, VideoOff, Eye, Camera } from 'lucide-react';

export default function CameraOptionPicker({ value, onChange, premiumRate = 5 }) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium block">Job Mode</label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* No Camera */}
        <button
          type="button"
          onClick={() => onChange('no_camera')}
          className={`flex flex-col gap-2 p-4 rounded-xl border text-left transition-all ${
            value === 'no_camera'
              ? 'border-primary/50 bg-primary/5 text-foreground'
              : 'border-white/10 bg-muted/30 text-muted-foreground hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${value === 'no_camera' ? 'bg-primary/20' : 'bg-muted'}`}>
              <VideoOff className={`w-4 h-4 ${value === 'no_camera' ? 'text-primary' : ''}`} />
            </div>
            <span className="font-semibold text-sm">No Camera</span>
          </div>
          <p className="text-xs leading-relaxed">Avatar completes the job without live stream. You can request progress photos anytime via chat. Job finishes with a proof photo.</p>
          <p className="text-xs font-medium text-green-400">Standard price</p>
        </button>

        {/* Live Camera */}
        <button
          type="button"
          onClick={() => onChange('live_camera')}
          className={`flex flex-col gap-2 p-4 rounded-xl border text-left transition-all ${
            value === 'live_camera'
              ? 'border-primary/50 bg-primary/5 text-foreground'
              : 'border-white/10 bg-muted/30 text-muted-foreground hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${value === 'live_camera' ? 'bg-primary/20' : 'bg-muted'}`}>
              <Video className={`w-4 h-4 ${value === 'live_camera' ? 'text-primary' : ''}`} />
            </div>
            <span className="font-semibold text-sm">Live Camera</span>
            <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">+${premiumRate}/hr</span>
          </div>
          <p className="text-xs leading-relaxed">Watch every step live via avatar's camera. More secure — you see exactly what's happening in real time.</p>
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <Eye className="w-3 h-3" /> Live visibility · <Camera className="w-3 h-3" /> Progress photos
          </div>
        </button>
      </div>
    </div>
  );
}