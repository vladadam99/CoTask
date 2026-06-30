import React from 'react';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Heart, Trash2, ArrowLeft } from 'lucide-react';

export default function Saved() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const activeRole = user?.selected_role || user?.role || 'user';
  const dashPath = activeRole === 'avatar' ? '/AvatarDashboard' : activeRole === 'enterprise' ? '/EnterpriseDashboard' : '/UserDashboard';

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites', user?.email],
    queryFn: () => base44.entities.Favorite.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const removeFav = useMutation({
    mutationFn: (id) => base44.entities.Favorite.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  return (
    <AppShell navItems={getNavItems(activeRole)} user={user}>
      <div className="max-w-3xl mx-auto">
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
          <GlassCard className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No saved Local Agents</h3>
            <p className="text-sm text-muted-foreground mb-4">Browse and save your favorite Local Agents for quick access.</p>
            <Link to="/FindPeople"><Button>Discover Local Agents</Button></Link>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}