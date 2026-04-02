import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Camera, Loader2, Car, MapPin, Hammer, Flag } from 'lucide-react';

const STATUSES = [
  { key: 'on_the_way', label: 'On My Way', icon: Car, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', emoji: '🚗' },
  { key: 'arrived',    label: 'Arrived',   icon: MapPin, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', emoji: '📍' },
  { key: 'working',    label: 'Working',   icon: Hammer, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', emoji: '🔨' },
  { key: 'wrapping_up', label: 'Wrapping Up', icon: Flag, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', emoji: '🏁' },
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
    const now = new Date().toISOString();
    await Promise.all([
      base44.entities.JobPost.update(job.id, {
        arrival_status: statusKey,
        arrival_status_updated_at: now,
      }),
      base44.entities.Message.create({
        conversation_id: conversationId,
        sender_email: 'system',
        sender_name: 'CoTask',
        content: `${s.emoji} ${user.full_name} status update: **${s.label}**`,
        message_type: 'system',
      }),
      base44.entities.Conversation.update(conversationId, {
        last_message: `${s.emoji} ${s.label}`,
        last_message_at: now,
        last_message_by: 'system',
      }),
      base44.entities.Notification.create({
        user_email: job.posted_by_email,
        title: `${s.emoji} Avatar update: ${s.label}`,
        message: `${user.full_name} is now: ${s.label}`,
        type: 'session_live',
        link: `/Messages?conversation=${conversationId}`,
        reference_id: job.id,
        target_role: 'user',
      }),
    ]);
    onJobUpdated?.();
    setUpdatingStatus(null);
  };

  const uploadProgressPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const existing = job.progress_photos || [];
    const now = new Date().toISOString();
    await Promise.all([
      base44.entities.JobPost.update(job.id, { progress_photos: [...existing, file_url] }),
      base44.entities.Message.create({
        conversation_id: conversationId,
        sender_email: user.email,
        sender_name: user.full_name,
        content: file_url,
        message_type: 'photo',
      }),
      base44.entities.Conversation.update(conversationId, {
        last_message: '📸 Progress photo',
        last_message_at: now,
        last_message_by: user.email,
      }),
      base44.entities.Notification.create({
        user_email: job.posted_by_email,
        title: `📸 Progress photo from ${user.full_name}`,
        message: 'Your avatar shared a progress update photo.',
        type: 'message',
        link: `/Messages?conversation=${conversationId}`,
        reference_id: job.id,
        target_role: 'user',
      }),
    ]);
    onJobUpdated?.();
    setUploading(false);
  };

  return (
    <div className="mx-4 my-2 glass rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-semibold text-green-400">Job Live — Update Your Status</span>
        </div>
        {current && (
          <span className={`text-xs px-2 py-0.5 rounded-full border ${current.bg} ${current.color} font-medium`}>
            {current.emoji} {current.label}
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
                  : 'border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground'
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
        <label className={`flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-dashed border-white/10 text-xs text-muted-foreground cursor-pointer hover:bg-white/5 hover:text-foreground transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <input type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadProgressPhoto(f); e.target.value = ''; }} />
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          {uploading ? 'Uploading…' : 'Share a progress photo with client'}
        </label>
      </div>
    </div>
  );
}