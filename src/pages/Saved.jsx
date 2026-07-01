import React from 'react';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Heart, Trash2 } from 'lucide-react';
import { EmptyState, PageHero } from '@/components/ui/PagePrimitives';

export default function Saved() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const activeRole = user?.selected_role || user?.role || 'user';

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
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHero
          eyebrow="Saved"
          title="Saved Local Agents"
          description="Keep trusted agents close for repeat bookings and faster direct hire requests."
          icon={Heart}
          stats={[
            { label: 'Saved', value: favorites.length },
            { label: 'Next step', value: 'Book' },
            { label: 'Use case', value: 'Repeat work' },
          ]}
        />

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
          <EmptyState
            icon={Heart}
            title="No saved Local Agents"
            description="Browse and save agents you may want to hire again."
            action={<Link to="/FindPeople"><Button>Discover Local Agents</Button></Link>}
          />
        )}
      </div>
    </AppShell>
  );
}

