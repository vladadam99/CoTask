import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Star, Shield, Filter, X, Heart, ArrowLeft, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { label: 'All', icon: '🌐' },
  { label: 'City Guide', icon: '🌆' },
  { label: 'Property Walkthrough', icon: '🏠' },
  { label: 'Shopping Help', icon: '🛍️' },
  { label: 'Event Attendance', icon: '🎫' },
  { label: 'Queue & Errands', icon: '📦' },
  { label: 'Family Support', icon: '👨‍👩‍👧' },
  { label: 'Business Inspection', icon: '🏢' },
  { label: 'Training & Coaching', icon: '🎓' },
  { label: 'Travel Assistance', icon: '✈️' },
  { label: 'Custom Request', icon: '✨' },
];

export default function Explore() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const dashPath = user?.role === 'avatar' ? '/AvatarDashboard' : user?.role === 'enterprise' ? '/EnterpriseDashboard' : '/UserDashboard';
  const initialCat = urlParams.get('category') || 'All';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCat);
  const [city, setCity] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: avatars = [], isLoading } = useQuery({
    queryKey: ['explore-avatars'],
    queryFn: () => base44.entities.AvatarProfile.filter({ status: 'active' }, '-rating', 50),
  });

  const filtered = avatars.filter(a => {
    const matchSearch = !search || a.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      (a.categories || []).some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchCat = category === 'All' || (a.categories || []).includes(category);
    const matchCity = !city || a.city?.toLowerCase().includes(city.toLowerCase());
    return matchSearch && matchCat && matchCity;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-3 space-y-3">
          {/* Top row */}
          <div className="flex items-center gap-3">
            <Link to={dashPath} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 hover:border-primary/30 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search avatars or skills..."
                className="pl-9 bg-white/5 border-white/10 h-10 rounded-xl text-sm"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${showFilters ? 'bg-primary text-white border-primary' : 'bg-white/5 border-white/10 hover:border-primary/30'}`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* City filter (when open) */}
          {showFilters && (
            <div className="flex items-center gap-2 pb-1">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Filter by city..."
                className="bg-white/5 border-white/10 h-9 text-sm max-w-xs"
              />
              {city && (
                <button onClick={() => setCity('')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          )}

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide -mx-0.5 px-0.5">
            {CATEGORIES.map(cat => (
              <button key={cat.label} onClick={() => setCategory(cat.label)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  cat.label === category
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white/5 border border-white/10 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}>
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Count */}
        <p className="text-xs text-muted-foreground mb-5">
          {isLoading ? 'Finding avatars...' : `${filtered.length} avatar${filtered.length !== 1 ? 's' : ''} available`}
        </p>

        {/* Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-2xl bg-card/40 border border-white/5 p-5 animate-pulse h-48" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-3xl">🔍</p>
            <h3 className="font-bold">No avatars found</h3>
            <p className="text-sm text-muted-foreground">Try a different category or clear your filters</p>
            <Button variant="outline" className="border-white/10 mt-2" onClick={() => { setSearch(''); setCategory('All'); setCity(''); }}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((avatar, i) => (
              <AvatarCard key={avatar.id} avatar={avatar} i={i} user={user} queryClient={queryClient} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AvatarCard({ avatar, i, user, queryClient }) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.05, 0.3) }}
    >
      <Link to={`/AvatarView?id=${avatar.id}`}>
        <div className="group bg-card/50 hover:bg-card/80 border border-white/5 hover:border-primary/20 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
          {/* Top: avatar photo / initial */}
          <div className="relative h-36 bg-gradient-to-br from-primary/10 via-card to-card flex items-center justify-center overflow-hidden">
            {avatar.photo_url
              ? <img src={avatar.photo_url} alt={avatar.display_name} className="w-full h-full object-cover" />
              : <span className="text-5xl font-black text-primary/30">{avatar.display_name?.[0] || 'A'}</span>
            }
            {/* Available badge */}
            {avatar.is_available && (
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-green-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Available
              </div>
            )}
            {/* Fav button */}
            {user && (
              <button
                onClick={e => { e.preventDefault(); toggleFav.mutate(); }}
                disabled={toggleFav.isPending}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-primary text-primary' : 'text-white'}`} />
              </button>
            )}
            {/* Verified */}
            {avatar.is_verified && (
              <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Bottom: info */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-bold text-sm truncate">{avatar.display_name}</h3>
              {avatar.rating > 0 && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-semibold">{avatar.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <MapPin className="w-3 h-3 flex-shrink-0" /> {avatar.city || 'Remote'}
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {(avatar.categories || []).slice(0, 2).map(c => (
                <span key={c} className="text-[10px] bg-white/5 border border-white/5 rounded-full px-2 py-0.5 text-muted-foreground">{c}</span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-primary">${avatar.hourly_rate || 30}<span className="text-xs font-normal text-muted-foreground">/hr</span></span>
              <span className="text-[10px] text-muted-foreground">{avatar.completed_jobs || 0} jobs</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}