import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import {
  Home, Inbox, Calendar, Radio, MessageSquare, DollarSign,
  Star, User, Settings, Film, Play, Share2, Trash2, Clock,
  Download, Eye, EyeOff
} from 'lucide-react';
import { format } from 'date-fns';

const navItems = [
  { icon: Home, label: 'Home', path: '/AvatarDashboard' },
  { icon: Inbox, label: 'Requests', path: '/AvatarRequests' },
  { icon: Calendar, label: 'Schedule', path: '/AvatarSchedule' },
  { icon: Radio, label: 'Live', path: '/AvatarLive' },
  { icon: MessageSquare, label: 'Messages', path: '/Messages' },
  { icon: DollarSign, label: 'Earnings', path: '/AvatarEarnings' },
  { icon: Star, label: 'Reviews', path: '/AvatarReviews' },
  { icon: User, label: 'Profile', path: '/AvatarProfileEdit' },
  { icon: Settings, label: 'Settings', path: '/AvatarSettings' },
];

function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RecordingLibrary() {
  const { user, loading } = useCurrentUser();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState(null);

  const { data: recordings = [] } = useQuery({
    queryKey: ['recordings', user?.email],
    queryFn: () => base44.entities.Recording.filter({ avatar_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const toggleShare = useMutation({
    mutationFn: (r) => base44.entities.Recording.update(r.id, { is_shared_with_client: !r.is_shared_with_client }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recordings', user?.email] }),
  });

  const deleteRec = useMutation({
    mutationFn: (id) => base44.entities.Recording.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recordings', user?.email] }),
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <AppShell navItems={navItems} user={user}>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-3">
          <Film className="w-7 h-7 text-primary" /> Recording Library
        </h1>
        <p className="text-muted-foreground text-sm">Browse, share, and manage your session recordings</p>
      </div>

      {recordings.length === 0 ? (
        <GlassCard className="p-14 text-center">
          <Film className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-medium mb-1">No recordings yet</p>
          <p className="text-sm text-muted-foreground">
            Start a live session and hit Record — your clips will appear here automatically.
          </p>
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recordings.map(r => (
            <GlassCard key={r.id} className="overflow-hidden flex flex-col">
              {/* Thumbnail / preview area */}
              <div
                className="relative bg-black/40 aspect-video flex items-center justify-center cursor-pointer group"
                onClick={() => r.file_url && setPreview(r)}
              >
                {r.thumbnail_url ? (
                  <img src={r.thumbnail_url} alt={r.title} className="w-full h-full object-cover" />
                ) : (
                  <Film className="w-10 h-10 text-muted-foreground/30" />
                )}
                {r.file_url && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                  </div>
                )}
                {/* Mode badge */}
                <span className="absolute top-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-md uppercase">
                  {r.stream_mode || 'std'}
                </span>
                {r.is_shared_with_client && (
                  <span className="absolute top-2 right-2 text-xs bg-green-500/80 text-white px-2 py-0.5 rounded-md">Shared</span>
                )}
              </div>

              <div className="p-4 flex flex-col gap-2 flex-1">
                <p className="font-medium text-sm truncate">{r.title}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {r.client_name && <span>{r.client_name}</span>}
                  {r.duration_seconds && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDuration(r.duration_seconds)}
                    </span>
                  )}
                  {r.file_size_mb && <span>{r.file_size_mb.toFixed(1)} MB</span>}
                </div>
                {r.created_date && (
                  <p className="text-xs text-muted-foreground">{format(new Date(r.created_date), 'MMM d, yyyy')}</p>
                )}

                <div className="flex items-center gap-2 mt-auto pt-2">
                  {r.file_url && (
                    <a href={r.file_url} download target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="gap-1 text-xs px-2 h-7">
                        <Download className="w-3.5 h-3.5" /> Save
                      </Button>
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`gap-1 text-xs px-2 h-7 ${r.is_shared_with_client ? 'text-green-400' : ''}`}
                    onClick={() => toggleShare.mutate(r)}
                  >
                    {r.is_shared_with_client ? <EyeOff className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    {r.is_shared_with_client ? 'Unshare' : 'Share'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-xs px-2 h-7 text-red-400 hover:text-red-300 ml-auto"
                    onClick={() => deleteRec.mutate(r.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Video preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreview(null)}>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <video
              src={preview.file_url}
              controls
              autoPlay
              className="w-full rounded-xl"
            />
            <p className="text-center text-sm text-white/70 mt-3">{preview.title} — click outside to close</p>
          </div>
        </div>
      )}
    </AppShell>
  );
}