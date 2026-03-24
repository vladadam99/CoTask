import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Play, Heart, MessageCircle, Share2, MapPin, Star, ArrowLeft, Zap, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReelFeed() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [search, setSearch] = useState('');
  const [likedReels, setLikedReels] = useState({});

  const { data: reels = [], isLoading } = useQuery({
    queryKey: ['reels-feed'],
    queryFn: () => base44.entities.Reel.filter({ is_published: true }, '-created_date', 40),
  });

  const { data: liveAvatars = [] } = useQuery({
    queryKey: ['live-avatars'],
    queryFn: () => base44.entities.AvatarProfile.filter({ is_available: true, status: 'active' }, '-rating', 8),
  });

  const handleLike = (reel) => {
    setLikedReels(prev => ({ ...prev, [reel.id]: !prev[reel.id] }));
    // Optimistic only — no backend mutation to avoid race conditions in beta
  };

  const filteredReels = reels.filter(r =>
    !search || r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.category?.toLowerCase().includes(search.toLowerCase()) ||
    r.avatar_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-strong border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reels..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <span className="text-xl font-bold">Co<span className="text-primary">Task</span></span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Live Now Strip */}
        {liveAvatars.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-semibold">Live Now</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {liveAvatars.map(avatar => (
                <Link key={avatar.id} to={`/AvatarView?id=${avatar.id}`} className="flex-shrink-0 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-primary overflow-hidden bg-primary/10 flex items-center justify-center text-xl font-bold text-primary mx-auto">
                      {avatar.photo_url
                        ? <img src={avatar.photo_url} alt={avatar.display_name} className="w-full h-full object-cover" />
                        : avatar.display_name?.[0] || 'A'}
                    </div>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-bold px-1.5 rounded-full">LIVE</span>
                  </div>
                  <p className="text-xs mt-2 text-muted-foreground max-w-[64px] truncate">{avatar.display_name}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reels Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="aspect-[9/16] rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredReels.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredReels.map((reel, i) => (
              <motion.div
                key={reel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-card border border-white/5 cursor-pointer group"
              >
                {/* Thumbnail */}
                {reel.thumbnail_url ? (
                  <img src={reel.thumbnail_url} alt={reel.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-900/40 flex items-center justify-center">
                    <Play className="w-10 h-10 text-white/40" />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Top badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {reel.category && (
                    <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                      {reel.category}
                    </span>
                  )}
                </div>

                {/* Play icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs font-semibold line-clamp-2 mb-2">{reel.title}</p>
                  <div className="flex items-center gap-1 mb-2">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary overflow-hidden">
                      {reel.avatar_photo_url
                        ? <img src={reel.avatar_photo_url} className="w-full h-full object-cover" />
                        : reel.avatar_name?.[0] || 'A'}
                    </div>
                    <span className="text-white/70 text-[10px] truncate">{reel.avatar_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-[10px]">{(reel.views || 0).toLocaleString()} views</span>
                    <button
                      onClick={e => { e.stopPropagation(); handleLike(reel); }}
                      className="flex items-center gap-1 text-[10px]"
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedReels[reel.id] ? 'fill-primary text-primary' : 'text-white/60'}`} />
                      <span className="text-white/60">{(reel.likes || 0)}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-12 text-center">
            <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No reels yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search ? 'No reels match your search.' : 'Avatars will publish reels from their recordings.'}
            </p>
            <Link to="/Explore" className="text-primary text-sm hover:underline">Explore Avatars →</Link>
          </div>
        )}
      </div>
    </div>
  );
}