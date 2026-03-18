import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import {
  Home, Inbox, Calendar, Radio, MessageSquare, DollarSign,
  Star, User, Settings, Film, Download, Share2, Trash2, Clock, HardDrive
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

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

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(secs) {
  if (!secs) return '—';
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}m ${s}s`;
}

export default function RecordingLibrary() {
  const { user, loading } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ['session-recordings', user?.email],
    queryFn: () => base44.entities.SessionRecording.filter({ avatar_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SessionRecording.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-recordings'] });
      toast({ title: 'Recording deleted' });
    },
  });

  const shareMutation = useMutation({
    mutationFn: ({ id, val }) => base44.entities.SessionRecording.update(id, { is_shared_with_client: val }),
    onSuccess: (_, { val }) => {
      queryClient.invalidateQueries({ queryKey: ['session-recordings'] });
      toast({ title: val ? 'Shared with client' : 'Sharing revoked' });
    },
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.SessionRecording.create({
        avatar_email: user.email,
        title: file.name.replace(/\.[^/.]+$/, ''),
        file_url,
        size_bytes: file.size,
        duration_seconds: 0,
      });
      queryClient.invalidateQueries({ queryKey: ['session-recordings'] });
      toast({ title: 'Recording uploaded!' });
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
    setUploading(false);
  };

  if (loading || isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <AppShell navItems={navItems} user={user}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">Recording Library</h1>
          <p className="text-muted-foreground text-sm">{recordings.length} session recording{recordings.length !== 1 ? 's' : ''}</p>
        </div>
        <label className="cursor-pointer">
          <input type="file" accept="video/*" className="hidden" onChange={handleUpload} />
          <Button disabled={uploading} className="gap-2">
            {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Film className="w-4 h-4" />}
            {uploading ? 'Uploading…' : 'Upload Recording'}
          </Button>
        </label>
      </div>

      {recordings.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <Film className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm mb-2">No recordings yet</p>
          <p className="text-xs text-muted-foreground/60">Recordings saved during live sessions will appear here, or upload manually above.</p>
        </GlassCard>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {recordings.map(rec => (
            <GlassCard key={rec.id} className="p-0 overflow-hidden flex flex-col">
              {/* Thumbnail / placeholder */}
              <div className="h-36 bg-secondary/50 flex items-center justify-center relative">
                {rec.thumbnail_url ? (
                  <img src={rec.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Film className="w-10 h-10 text-muted-foreground/30" />
                )}
                {rec.is_shared_with_client && (
                  <span className="absolute top-2 right-2 bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/20">
                    Shared
                  </span>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col gap-3">
                <div>
                  <p className="font-medium text-sm truncate">{rec.title}</p>
                  {rec.client_name && <p className="text-xs text-muted-foreground mt-0.5">Client: {rec.client_name}</p>}
                  {rec.category && <p className="text-xs text-muted-foreground">{rec.category}</p>}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {rec.duration_seconds > 0 && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(rec.duration_seconds)}</span>
                  )}
                  <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{formatBytes(rec.size_bytes)}</span>
                  <span className="ml-auto">{rec.created_date ? format(new Date(rec.created_date), 'MMM d') : ''}</span>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  {rec.file_url && (
                    <a href={rec.file_url} download target="_blank" rel="noreferrer" className="flex-1">
                      <Button size="sm" variant="secondary" className="w-full gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Download
                      </Button>
                    </a>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className={`gap-1.5 ${rec.is_shared_with_client ? 'text-green-400 border-green-500/30' : ''}`}
                    onClick={() => shareMutation.mutate({ id: rec.id, val: !rec.is_shared_with_client })}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => { if (confirm('Delete this recording?')) deleteMutation.mutate(rec.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}