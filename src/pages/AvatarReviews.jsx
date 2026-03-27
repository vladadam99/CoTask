import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { getNavItems } from '@/lib/navItems';
import { Star } from 'lucide-react';
import { format } from 'date-fns';



function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
      ))}
    </div>
  );
}

export default function AvatarReviews() {
  const { user, loading } = useCurrentUser();

  const { data: reviews = [] } = useQuery({
    queryKey: ['avatar-reviews', user?.email],
    queryFn: () => base44.entities.Review.filter({ avatar_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ['avatar-profile-reviews', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.AvatarProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';
  const dist = [5, 4, 3, 2, 1].map(n => ({ n, count: reviews.filter(r => r.rating === n).length }));

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1">Reviews</h1>
        <p className="text-muted-foreground text-sm">{reviews.length} review{reviews.length !== 1 ? 's' : ''} from clients</p>
      </div>

      {/* Summary */}
      <GlassCard className="p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-primary">{avgRating}</p>
            <StarRating rating={Math.round(parseFloat(avgRating) || 0)} />
            <p className="text-xs text-muted-foreground mt-1">{reviews.length} reviews</p>
          </div>
          <div className="flex-1 w-full space-y-2">
            {dist.map(({ n, count }) => (
              <div key={n} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-3">{n}</span>
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }} />
                </div>
                <span className="text-xs text-muted-foreground w-5 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No reviews yet. Complete bookings to earn reviews.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <GlassCard key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {r.reviewer_name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{r.reviewer_name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">{r.category}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StarRating rating={r.rating} />
                  <p className="text-xs text-muted-foreground">{r.created_date ? format(new Date(r.created_date), 'MMM d, yyyy') : ''}</p>
                </div>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">"{r.comment}"</p>}
            </GlassCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}