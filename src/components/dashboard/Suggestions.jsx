import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import GlassCard from '@/components/ui/GlassCard';
import { Sparkles, ArrowRight, MapPin, Star } from 'lucide-react';

export default function Suggestions({ user }) {
  const { data: bookings = [] } = useQuery({
    queryKey: ['user-bookings-for-suggestions', user?.email],
    queryFn: () => base44.entities.Booking.filter({ client_email: user.email }, '-created_date', 20),
    enabled: !!user,
  });

  const { data: avatars = [] } = useQuery({
    queryKey: ['suggestion-avatars'],
    queryFn: () => base44.entities.AvatarProfile.filter({ status: 'active', is_available: true }, '-rating', 30),
  });

  // Derive top categories from past bookings
  const topCategories = useMemo(() => {
    const counts = {};
    bookings.forEach(b => { if (b.category) counts[b.category] = (counts[b.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([cat]) => cat);
  }, [bookings]);

  // Suggest avatars matching top categories, excluding already-booked ones
  const bookedAvatarEmails = new Set(bookings.map(b => b.avatar_email));
  const suggested = useMemo(() => {
    if (topCategories.length === 0) {
      return avatars.filter(a => a.is_featured).slice(0, 3);
    }
    const matched = avatars.filter(a =>
      !bookedAvatarEmails.has(a.user_email) &&
      (a.categories || []).some(c => topCategories.includes(c))
    );
    return matched.slice(0, 3);
  }, [avatars, topCategories, bookedAvatarEmails]);

  if (suggested.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Suggested for You
        </h2>
        <Link to="/Explore" className="text-sm text-primary hover:underline flex items-center gap-1">
          See all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {suggested.map(avatar => (
          <Link key={avatar.id} to={`/AvatarView?id=${avatar.id}`}>
            <GlassCard className="p-4" hover>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {avatar.display_name?.[0] || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{avatar.display_name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {avatar.city || 'Remote'}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-primary">${avatar.hourly_rate || 30}/hr</span>
                {avatar.rating > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400" /> {avatar.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(avatar.categories || []).slice(0, 2).map(c => (
                  <span key={c} className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5">{c}</span>
                ))}
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}