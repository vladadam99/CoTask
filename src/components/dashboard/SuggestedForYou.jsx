import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, MapPin, Sparkles } from 'lucide-react';

export default function SuggestedForYou({ user }) {
  const { data, isLoading } = useQuery({
    queryKey: ['suggested-avatars', user?.email, user?.interests],
    queryFn: async () => {
      const res = await base44.functions.invoke('matchSuggestions', { type: 'avatars_for_user' });
      return res.data?.suggestions || [];
    },
    enabled: !!user && (user.interests?.length > 0),
    staleTime: 5 * 60 * 1000,
  });

  if (!user?.interests?.length || isLoading || !data?.length) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-base font-bold">Suggested for You</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {data.map(avatar => (
          <Link key={avatar.id} to={`/AvatarView?id=${avatar.id}`} className="flex-shrink-0 w-52">
            <div className="glass border border-white/5 hover:border-primary/30 rounded-2xl p-4 transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary overflow-hidden flex-shrink-0">
                  {avatar.photo_url
                    ? <img src={avatar.photo_url} alt={avatar.display_name} className="w-full h-full object-cover" />
                    : avatar.display_name?.[0] || 'A'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{avatar.display_name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {avatar.city || 'Remote'}
                  </div>
                </div>
              </div>
              {(avatar.bio || (avatar.skills?.length > 0)) && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {avatar.bio || avatar.skills?.join(', ')}
                </p>
              )}
              {avatar.skills?.length > 0 && avatar.bio && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {avatar.skills.slice(0, 2).map(s => (
                    <span key={s} className="text-[10px] bg-white/5 border border-white/5 rounded px-1.5 py-0.5">{s}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary">${avatar.hourly_rate || 30}/hr</span>
                {avatar.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs">{avatar.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}