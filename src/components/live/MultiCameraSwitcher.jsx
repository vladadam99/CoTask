import React from 'react';
import { Camera, SwitchCamera } from 'lucide-react';

export default function MultiCameraSwitcher({ videoDevices, activeDeviceId, onSwitch }) {
  if (!videoDevices || videoDevices.length < 2) return null;

  return (
    <div className="glass border border-white/10 rounded-xl p-3 space-y-2">
      <h3 className="text-xs font-semibold flex items-center gap-1.5">
        <SwitchCamera className="w-3.5 h-3.5 text-blue-400" /> Switch Camera
      </h3>
      <div className="space-y-1">
        {videoDevices.map((d, i) => {
          const label = d.label || `Camera ${i + 1}`;
          const isActive = d.deviceId === activeDeviceId;
          return (
            <button
              key={d.deviceId}
              onClick={() => !isActive && onSwitch(d.deviceId)}
              className={`w-full flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-all ${
                isActive
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 cursor-default'
                  : 'bg-card/40 border-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground cursor-pointer'
              }`}
            >
              <Camera className="w-3 h-3 shrink-0" />
              <span className="truncate">{label}</span>
              {isActive && <span className="ml-auto text-blue-400 text-[10px] font-semibold">LIVE</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}