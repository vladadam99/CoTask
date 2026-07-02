import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DailyVideoCall from '@/components/live/DailyVideoCall';
import SmartImage from '@/components/media/SmartImage';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Radio, UserRound } from 'lucide-react';

export default function PublicLiveView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postId = searchParams.get('post');
  const reelId = searchParams.get('reel');

  const { data: liveItem, isLoading } = useQuery({
    queryKey: ['public-live-view', postId, reelId],
    queryFn: async () => {
      if (postId) {
        const posts = await base44.entities.Post.filter({ id: postId });
        return posts[0] ? { ...posts[0], source: 'post' } : null;
      }
      if (reelId) {
        const reels = await base44.entities.Reel.filter({ id: reelId });
        return reels[0] ? { ...reels[0], source: 'reel' } : null;
      }
      return null;
    },
    enabled: !!(postId || reelId),
    refetchInterval: 10000,
  });

  const isLive = liveItem?.is_live && liveItem?.live_status === 'live' && liveItem?.live_url;
  const avatarName = liveItem?.avatar_name || 'Local Agent';
  const publicUrl = `${window.location.origin}/PublicLiveView?${postId ? `post=${postId}` : `reel=${reelId}`}`;

  const copyLink = () => {
    navigator.clipboard?.writeText(publicUrl).catch(() => {});
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!liveItem) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Live stream not found</h1>
        <Button onClick={() => navigate('/ReelFeed')}>Open Reels</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Radio className="h-4 w-4 text-red-500" /> Public live
          </div>
          <Button size="sm" variant="outline" onClick={copyLink}>Share</Button>
        </div>
      </div>

      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-xl border border-border bg-black" style={{ minHeight: 520 }}>
          {isLive ? (
            <DailyVideoCall roomUrl={liveItem.live_url} isHost={false} className="h-[520px]" />
          ) : (
            <div className="flex h-[520px] flex-col items-center justify-center gap-3 bg-card text-center">
              <Radio className="h-10 w-10 text-muted-foreground" />
              <h1 className="text-xl font-bold">This live has ended</h1>
              <p className="max-w-sm text-sm text-muted-foreground">
                The agent is no longer broadcasting. Check Reels for new public live sessions.
              </p>
              <Link to="/ReelFeed">
                <Button>Open Reels</Button>
              </Link>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">
                {liveItem.avatar_photo_url ? (
                  <SmartImage src={liveItem.avatar_photo_url} alt={avatarName} className="h-full w-full object-cover" />
                ) : (
                  avatarName[0] || <UserRound className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{avatarName}</p>
                <p className="text-xs text-muted-foreground">{isLive ? 'Live now' : 'Stream ended'}</p>
              </div>
            </div>
            <h1 className="text-lg font-bold">{liveItem.title || liveItem.caption || `${avatarName} is live`}</h1>
            {(liveItem.description || liveItem.caption) && (
              <p className="mt-2 text-sm text-muted-foreground">{liveItem.description || liveItem.caption}</p>
            )}
          </div>

          {liveItem.avatar_profile_id && (
            <Link to={`/AvatarView?id=${liveItem.avatar_profile_id}`}>
              <Button variant="outline" className="w-full">View agent profile</Button>
            </Link>
          )}
        </aside>
      </main>
    </div>
  );
}
