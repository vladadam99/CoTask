import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SmartImage from '@/components/media/SmartImage';
import { MapPin, Star, Shield, Heart, Zap, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AvatarProfileCard({ avatar, user, index }) {
  const queryClient = useQueryClient();

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
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      className="border-b border-white/[0.05]"
    >
      <div className="overflow-hidden bg-transparent relative">
        {/* Cover banner — taller, full bleed */}
        <div className="h-36 relative">
          {avatar.cover_url ? (
            <SmartImage src={avatar.cover_url} alt="" className="w-full h-full" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-red-500/10 to-purple-900/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-card/90" />
          {/* Fav button */}
          {user && (
            <button
              onClick={() => toggleFav.mutate()}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-primary text-primary' : 'text-white/80'}`} />
            </button>
          )}
        </div>

        {/* Avatar photo overlapping cover */}
        <div className="px-4 pb-4">
          <div className="flex items-end gap-3 -mt-10 mb-3">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary/10 border-2 border-background flex items-center justify-center text-2xl font-bold text-primary shadow-xl">
                {avatar.photo_url
                  ? <SmartImage src={avatar.photo_url} alt={avatar.display_name} className="w-full h-full" width={64} />
                  : avatar.display_name?.[0] || 'A'}
              </div>
              {avatar.is_available && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-background" />
              )}
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm">{avatar.display_name}</span>
                {avatar.is_verified && <Shield className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {(avatar.city || avatar.country) && (
                  <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{[avatar.city, avatar.country].filter(Boolean).join(', ')}</span>
                )}
                {avatar.rating > 0 && (
                  <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{avatar.rating.toFixed(1)}</span>
                )}
              </div>
            </div>
            <div className="pb-1">
              <span className="text-primary font-bold text-sm">${avatar.hourly_rate || 30}<span className="text-muted-foreground font-normal text-xs">/hr</span></span>
            </div>
          </div>

          {/* Bio */}
          {avatar.bio && (
            <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{avatar.bio}</p>
          )}

          {/* Skills / Categories */}
          {((avatar.categories?.length > 0) || (avatar.skills?.length > 0)) && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(avatar.categories || []).slice(0, 3).map(c => (
                <span key={c} className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 font-medium">{c}</span>
              ))}
              {(avatar.skills || []).slice(0, 2).map(s => (
                <span key={s} className="text-[10px] bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-muted-foreground">{s}</span>
              ))}
            </div>
          )}

          {/* Languages */}
          {avatar.languages?.length > 0 && (
            <p className="text-[10px] text-muted-foreground mb-3">🌐 {avatar.languages.slice(0, 3).join(' · ')}</p>
          )}

          {/* Stats row */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
            <div className="flex gap-4 text-xs text-muted-foreground">
              {avatar.completed_jobs > 0 && <span><span className="text-foreground font-semibold">{avatar.completed_jobs}</span> jobs</span>}
              {avatar.review_count > 0 && <span><span className="text-foreground font-semibold">{avatar.review_count}</span> reviews</span>}
            </div>
            <Link to={`/AvatarView?id=${avatar.id}`}>
              <button className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-4 py-1.5 text-xs font-semibold hover:bg-primary/90 transition-colors">
                <Zap className="w-3 h-3" /> Book Now
              </button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}