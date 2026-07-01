import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, Loader2, Car, MapPin, Hammer, Flag } from 'lucide-react';

const STATUSES = [
  { key: 'on_the_way', label: 'On my way', icon: Car, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  { key: 'arrived', label: 'Arrived', icon: MapPin, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  { key: 'working', label: 'Working', icon: Hammer, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  { key: 'wrapping_up', label: 'Wrapping up', icon: Flag, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
];

export default function JobStatusTracker({ job, user, conversationId, onJobUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  if (!job || job.status !== 'in_progress' || !job.started_at) return null;

  const current = STATUSES.find(s => s.key === job.arrival_status);

  const updateStatus = async (statusKey) => {
    if (updatingStatus) return;
    setUpdatingStatus(statusKey);
    const s = STATUSES.find(x => x.key === statusKey);
    await Promise.all([
      base44.functions.invoke('updateJobProgress', {
        jobId: job.id,
        action: 'arrival_status',
        payload: { status: statusKey }
      }),
      base44.functions.invoke('sendMessage', {
        conversationId,
        content: `${user.full_name} status update: ${s.label}`,
        messageType: 'system',
        notifyTitle: `Local Agent update: ${s.label}`,
        notifyMessage: `${user.full_name} is now ${s.label}.`,
        notifyType: 'session_live',
        notifyLink: `/Messages?conversation=${conversationId}`,
        notifyTargetRole: 'user'
      }),
    ]);
    onJobUpdated?.();
    setUpdatingStatus(null);
  };

  const uploadProgressPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await Promise.all([
      base44.functions.invoke('updateJobProgress', {
        jobId: job.id,
        action: 'progress_photo',
        payload: { photo_url: file_url }
      }),
      base44.functions.invoke('sendMessage', {
        conversationId,
        content: file_url,
        messageType: 'photo',
        notifyTitle: `Progress photo from ${user.full_name}`,
        notifyMessage: 'Your Local Agent shared a progress update photo.',
        notifyType: 'message',
        notifyLink: `/Messages?conversation=${conversationId}`,
        notifyTargetRole: 'user'
      }),
    ]);
    onJobUpdated?.();
    setUploading(false);
  };

  return (
    <div className="mx-4 my-2 surface-panel rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-green-700">Task live - update your status</span>
        </div>
        {current && (
          <span className={`text-xs px-2 py-0.5 rounded-full border ${current.bg} ${current.color} font-medium`}>
            {current.label}
          </span>
        )}
      </div>

      {/* Status Buttons */}
      <div className="grid grid-cols-4 gap-1.5 p-3">
        {STATUSES.map(s => {
          const Icon = s.icon;
          const isActive = job.arrival_status === s.key;
          const isLoading = updatingStatus === s.key;
          return (
            <button key={s.key}
              onClick={() => updateStatus(s.key)}
              disabled={!!updatingStatus || uploading}
              className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border text-center transition-all ${
                isActive
                  ? `${s.bg} ${s.color} border-opacity-60 scale-105`
                  : 'border-border text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              {isLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Icon className="w-4 h-4" />
              }
              <span className="text-[10px] font-medium leading-tight">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Progress Photo */}
      <div className="px-3 pb-3">
        <label className={`flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground cursor-pointer hover:bg-secondary/60 hover:text-foreground transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <input type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadProgressPhoto(f); e.target.value = ''; }} />
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          {uploading ? 'Uploading...' : 'Share a progress photo with the client'}
        </label>
      </div>
    </div>
  );
}
