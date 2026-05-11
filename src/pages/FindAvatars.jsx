import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { getNavItems } from '@/lib/navItems';
import AppShell from '@/components/layout/AppShell';
import AvatarStoryRing from '@/components/home/AvatarStoryRing';
import AvatarProfileCard from '@/components/home/AvatarProfileCard';
import MediaFeedCard from '@/components/home/MediaFeedCard';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FindAvatars() {
  const { user } = useCurrentUser();
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { data: avatars = [], isLoading: loadingAvatars } = useQuery({
    queryKey: ['explore-avatars'],
    queryFn: () => base44.entities.AvatarProfile.filter({ status: 'active' }, '-rating', 40),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['home-posts'],
    queryFn: () => base44.entities.Post.filter({ is_published: true }, '-created_date', 30),
  });

  const { data: reels = [] } = useQuery({
    queryKey: ['home-reels'],
    queryFn: () => base44.entities.Reel.filter({ is_published: true }, '-created_date', 20),
  });

  // Interleaved feed: media + avatar profile cards every ~4 items
  const feedItems = useMemo(() => {
    const mediaItems = [
      ...posts.map(p => ({ ...p, _type: 'post' })),
      ...reels.map(r => ({ ...r, _type: 'reel' })),
    ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    // Search filter
    const searchLower = search.toLowerCase();
    const filteredAvatars = search
      ? avatars.filter(a =>
          [a.display_name, a.bio, a.city, ...(a.categories || []), ...(a.skills || [])]
            .join(' ').toLowerCase().includes(searchLower)
        )
      : avatars;
    const filteredMedia = search
      ? mediaItems.filter(m =>
          [m.avatar_name, m.caption, m.description, m.title, m.category]
            .join(' ').toLowerCase().includes(searchLower)
        )
      : mediaItems;

    const shuffled = [...filteredAvatars].sort(() => Math.random() - 0.5);
    let avatarIdx = 0;
    const feed = [];

    filteredMedia.forEach((item, i) => {
      feed.push({ type: item._type, data: item });
      if ((i + 1) % 4 === 0 && avatarIdx < shuffled.length) {
        feed.push({ type: 'avatar', data: shuffled[avatarIdx++] });
      }
    });

    // Append remaining avatars if no/few media
    if (filteredMedia.length === 0) {
      filteredAvatars.forEach(a => feed.push({ type: 'avatar', data: a }));
    }

    return feed;
  }, [posts, reels, avatars, search]);

  const liveAvatars = avatars.filter(a => a.is_available);
  const otherAvatars = avatars.filter(a => !a.is_available).slice(0, 10);

  return (
    <AppShell navItems={getNavItems(user?.selected_role)} user={user}>
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-2xl border-b border-white/5 -mx-4 px-4 lg:-mx-8 lg:px-8">
        <div className="max-w-2xl mx-auto flex items-center justify-between h-12">
          <span className="text-lg font-black tracking-tight">Co<span className="text-primary">Task</span></span>
          <button
            onClick={() => setShowSearch(v => !v)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${showSearch ? 'bg-primary/20 text-primary' : 'bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground'}`}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
        {showSearch && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pb-3 max-w-2xl mx-auto">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search avatars, skills, cities, content..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/40 placeholder:text-muted-foreground"
            />
          </motion.div>
        )}
      </div>

      {/* Full-width feed */}
      <div className="max-w-2xl mx-auto -mx-4 lg:-mx-8">
        {/* Stories strip */}
        {!search && (liveAvatars.length > 0 || otherAvatars.length > 0) && (
          <div className="px-4 pt-4 pb-3">
            <div className="flex gap-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {[...liveAvatars.slice(0, 10), ...otherAvatars].map(a => (
                <AvatarStoryRing key={a.id} avatar={a} />
              ))}
            </div>
          </div>
        )}

        {/* Feed */}
        <div className="pb-10">
          {loadingAvatars && feedItems.length === 0 ? (
            <div className="space-y-1 pt-2">
              {[1,2,3].map(i => <div key={i} className="bg-card/30 h-72 animate-pulse" />)}
            </div>
          ) : feedItems.length === 0 ? (
            <div className="text-center py-24 space-y-3 px-6">
              <p className="text-4xl">✨</p>
              <h3 className="font-bold">Nothing here yet</h3>
              <p className="text-sm text-muted-foreground">Avatars will post reels and content here soon.</p>
            </div>
          ) : (
            feedItems.map((item, i) =>
              item.type === 'avatar'
                ? <AvatarProfileCard key={`a-${item.data.id}`} avatar={item.data} user={user} index={i} />
                : <MediaFeedCard key={`m-${item.data.id}`} item={item.data} itemType={item.type} user={user} />
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}