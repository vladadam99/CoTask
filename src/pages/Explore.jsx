import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Input } from '@/components/ui/input';
import { getNavItems } from '@/lib/navItems';
import AppShell from '@/components/layout/AppShell';
import { motion } from 'framer-motion';
import {
  Search, MapPin, Star, Heart, MessageCircle, Zap, DollarSign,
  Play, Users, Shield, ArrowLeft
} from 'lucide-react';

const CATEGORIES = ['All', 'City Guide', 'Shopping', 'Food Tours', 'Museums', 'Travel', 'Events'];

export default function Explore() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const { data: avatars = [], isLoading } = useQuery({
    queryKey: ['explore-avatars'],
    queryFn: () => base44.entities.AvatarProfile.filter({ status: 'active' }, '-rating', 30),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['all-posts-explore'],
    queryFn: () => base44.entities.Post.filter({ is_published: true }, '-created_date', 60),
  });

  const filtered = avatars.filter(a => {
    const matchSearch = !search ||
      a.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.city?.toLowerCase().includes(search.toLowerCase()) ||
      (a.categories || []).some(c => c.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  // Group posts by avatar email for thumbnails
  const postsByAvatar = {};
  posts.forEach(p => {
    if (!postsByAvatar[p.avatar_email]) postsByAvatar[p.avatar_email] = [];
    if (postsByAvatar[p.avatar_email].length < 3) postsByAvatar[p.avatar_email].push(p);
  });

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black">Explore</h1>
          </div>
          <p className="text-sm text-muted-foreground">Discover live avatars worldwide</p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, city, skill..."
            className="pl-11 bg-white/5 border-white/10 h-12 rounded-2xl text-sm"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto mb-6 pb-1" style={{scrollbarWidth:'none', msOverflowStyle:'none'}}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                cat === category
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-white/5 border border-white/8 text-muted-foreground hover:border-white/20'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Avatar cards feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-3xl bg-card/40 border border-white/5 h-80 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <h3 className="font-bold mb-1">No avatars found</h3>
            <p className="text-sm text-muted-foreground">Try a different search</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((avatar, i) => (
              <AvatarCard
                key={avatar.id}
                avatar={avatar}
                i={i}
                user={user}
                queryClient={queryClient}
                thumbnails={postsByAvatar[avatar.user_email] || []}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function AvatarCard({ avatar, i, user, queryClient, thumbnails, navigate }) {
  const { data: isFavorited = false } = useQuery({
    queryKey: ['fav', user?.email, avatar.id],
    queryFn: async () => {
      const favs = await base44.entities.Favorite.filter({ user_email: user.email, avatar_profile_id: avatar.id });
      return favs.length > 0;
    },
    enabled: !!user,
  });

  const toggleFav = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        const favs = await base44.entities.Favorite.filter({ user_email: user.email, avatar_profile_id: avatar.id });
        if (favs[0]) await base44.entities.Favorite.delete(favs[0].id);
      } else {
        await base44.entities.Favorite.create({ user_email: user.email, avatar_profile_id: avatar.id, avatar_name: avatar.display_name });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fav', user?.email, avatar.id] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const isLive = avatar.is_available;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.06, 0.4) }}
      onClick={() => navigate(`/AvatarView?id=${avatar.id}`)}
      className="cursor-pointer rounded-3xl border border-white/8 overflow-hidden bg-card/60 hover:border-white/15 transition-all"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      {/* Live badge */}
      {isLive && (
        <div className="flex items-center gap-1.5 px-4 pt-3">
          <span className="flex items-center gap-1.5 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </span>
        </div>
      )}

      <div className="p-4">
        {/* Avatar header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Photo */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-xl font-black text-primary overflow-hidden">
              {avatar.photo_url
                ? <img src={avatar.photo_url} alt={avatar.display_name} className="w-full h-full object-cover" />
                : avatar.display_name?.[0] || 'A'}
            </div>
            {/* Level badge */}
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[9px] font-black text-white border-2 border-background">
              {avatar.completed_jobs || 1}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-bold text-sm">{avatar.display_name}</h3>
              {avatar.is_verified && <Shield className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20 flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {avatar.city || 'Remote'}{avatar.country ? `, ${avatar.country}` : ''}
            </div>
            {/* Stats row */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{avatar.review_count || 0}</span>
              </div>
              {avatar.rating > 0 && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-3 h-3 fill-yellow-400" />
                  <span className="font-semibold">{avatar.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({avatar.review_count || 0})</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-primary font-bold ml-auto">
                <DollarSign className="w-3 h-3" />
                <span>{avatar.hourly_rate || 30}/hr</span>
              </div>
            </div>
          </div>

          {/* Heart */}
          <button
            onClick={e => { e.stopPropagation(); user && toggleFav.mutate(); }}
            disabled={!user || toggleFav.isPending}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors flex-shrink-0"
          >
            <Heart className={`w-5 h-5 transition-colors ${isFavorited ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
          </button>
        </div>

        {/* Description */}
        {avatar.bio && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{avatar.bio}</p>
        )}

        {/* Thumbnails — posts from this avatar */}
        {thumbnails.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 mb-3 rounded-xl overflow-hidden">
            {thumbnails.map((post, idx) => (
              <div key={post.id} className="aspect-square bg-white/5 rounded-xl overflow-hidden relative">
                {post.type === 'video'
                  ? <video src={post.media_url} className="w-full h-full object-cover" muted />
                  : <img src={post.media_url} alt="" className="w-full h-full object-cover" />}
                {post.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-white opacity-80" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={e => { e.stopPropagation(); navigate(`/CreateBooking?avatarId=${avatar.id}`); }}
            disabled={!isLive}
            className={`flex-1 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm transition-all active:scale-95 ${
              isLive
                ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white/8 text-muted-foreground cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4" />
            {isLive ? 'Join Live' : 'Offline'}
          </button>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/Messages`); }}
            className="px-4 py-3 rounded-2xl border border-white/15 bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          <Link
            to={`/AvatarView?id=${avatar.id}`}
            onClick={e => e.stopPropagation()}
            className="px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center hover:bg-primary/20 transition-all active:scale-95 text-xs font-semibold"
          >
            Book
          </Link>
        </div>
      </div>
    </motion.div>
  );
}