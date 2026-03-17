import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Trash2 } from 'lucide-react';

export default function Saved() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.email],
    queryFn: () => base44.entities.Favorite.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const removeFav = useMutation({
    mutationFn: (id) => base44.entities.Favorite.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const dashPath = user?.app_role === 'avatar' ? '/AvatarDashboard' : user?.app_role === 'enterprise' ? '/EnterpriseDashboard' : '/UserDashboard';

  return (
    <div className="min-h-screen pb-12 px-4">
      <div className="max-w-3xl mx-auto pt-8">
        <Link to={dashPath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h1 className="text-2xl font-bold mb-6">Saved Avatars</h1>

        {favorites.length > 0 ? (
          <div className="space-y-3">
            {favorites.map(f => (
              <GlassCard key={f.id} className="p-4 flex items-center justify-between">
                <Link to={`/AvatarView?id=${f.avatar_profile_id}`} className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {(f.avatar_name || 'A')[0]}
                  </div>
                  <span className="font-medium text-sm">{f.avatar_name || 'Avatar'}</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => removeFav.mutate(f.id)}>
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="p-10 text-center">
            <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">No saved avatars</h3>
            <p className="text-sm text-muted-foreground mb-4">Browse and save your favorite avatars for quick access</p>
            <Link to="/Explore"><Button className="bg-primary hover:bg-primary/90">Explore Avatars</Button></Link>
          </GlassCard>
        )}
      </div>
    </div>
  );
}