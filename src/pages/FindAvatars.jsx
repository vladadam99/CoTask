import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { getNavItems } from '@/lib/navItems';
import AppShell from '@/components/layout/AppShell';
import AvatarStoryRing from '@/components/home/AvatarStoryRing';
import AvatarProfileCard from '@/components/home/AvatarProfileCard';
import MediaFeedCard from '@/components/home/MediaFeedCard';
import { Search, Compass, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const TABS = [
  { key: 'for_you', label: 'For You', icon: Flame },
  { key: 'avatars', label: 'Avatars', icon: Compass },
];

export default function FindAvatars() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState('for_you');
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

  // Interleave: avatar card every ~4 media items
  const feedItems = useMemo(() => {
    if (loadingAvatars) return [];

    // Merge posts + reels, sorted by created_date desc
    const mediaItems = [
      ...posts.map(p => ({ ...p, _type: 'post' })),
      ...reels.map(r => ({ ...r, _type: 'reel' })),
    ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    // Shuffle avatars for variety
    const shuffled = [...avatars].sort(() => Math.random() - 0.5);
    let avatarIdx = 0;
    const feed = [];

    mediaItems.forEach((item, i) => {
      feed.push({ type: item._type, data: item });
      // Insert avatar card every 3 media items
      if ((i + 1) % 3 === 0 && avatarIdx < shuffled.length) {
        feed.push({ type: 'avatar', data: shuffled[avatarIdx++] });
      }
    });

    // If no media, just show avatar cards
    if (mediaItems.length === 0) {
      avatars.forEach(a => feed.push({ type: 'avatar', data: a }));
    }

    return feed;
  }, [posts, reels, avatars, loadingAvatars]);

  const filteredAvatars = search
    ? avatars.filter(a =>
        [a.display_name, a.bio, a.city, ...(a.categories || []), ...(a.skills || [])]
          .join(' ').toLowerCase().includes(search.toLowerCase())
      )
    : avatars;

  return (
    <AppShell navItems={getNavItems(user?.selected_role)} user={user}>
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-white/5 -mx-4 px-4 lg:-mx-8 lg:px-8 mb-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between h-12">
            <span className="text-lg font-black">Co<span className="text-primary">Task</span></span>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSearch(v => !v)} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-primary/30 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          {showSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pb-2">
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search avatars, skills, cities..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
              />
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex gap-0">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                  tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto -mx-4 lg:-mx-8">
        {/* Stories / live avatars strip */}
        {tab === 'for_you' && avatars.length > 0 && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {avatars.filter(a => a.is_available).slice(0, 12).map(a => (
                <AvatarStoryRing key={a.id} avatar={a} />
              ))}
              {avatars.filter(a => !a.is_available).slice(0, 8).map(a => (
                <AvatarStoryRing key={a.id} avatar={a} />
              ))}
            </div>
          </div>
        )}

        {/* FOR YOU feed */}
        {tab === 'for_you' && (
          <div className="pt-2 pb-8 space-y-1">
            {loadingAvatars && feedItems.length === 0 ? (
              <div className="space-y-3 px-4">
                {[1,2,3,4].map(i => <div key={i} className="rounded-3xl bg-card/40 border border-white/5 h-64 animate-pulse" />)}
              </div>
            ) : feedItems.length === 0 ? (
              <div className="text-center py-20 space-y-3 px-4">
                <p className="text-4xl">✨</p>
                <h3 className="font-bold">No content yet</h3>
                <p className="text-sm text-muted-foreground">Avatars will post reels and updates here soon.</p>
              </div>
            ) : (
              feedItems.map((item, i) => (
                item.type === 'avatar'
                  ? <AvatarProfileCard key={`a-${item.data.id}`} avatar={item.data} user={user} index={i} />
                  : <MediaFeedCard key={`m-${item.data.id}`} item={item.data} itemType={item.type} user={user} />
              ))
            )}
          </div>
        )}

        {/* AVATARS tab */}
        {tab === 'avatars' && (
          <div className="px-4 pt-4 pb-8 space-y-1">
            {search && (
              <p className="text-xs text-muted-foreground mb-3">{filteredAvatars.length} result{filteredAvatars.length !== 1 ? 's' : ''}</p>
            )}
            {filteredAvatars.map((a, i) => (
              <AvatarProfileCard key={a.id} avatar={a} user={user} index={i} />
            ))}
            {filteredAvatars.length === 0 && (
              <div className="text-center py-20">
                <p className="text-3xl mb-3">🔍</p>
                <p className="text-muted-foreground text-sm">No avatars match your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}