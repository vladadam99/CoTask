import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Star, Shield, Filter, Radio, Map, LayoutGrid, X, Heart, ArrowLeft, Sparkles, Zap } from 'lucide-react';
import AvatarMap from '@/components/explore/AvatarMap';
import GlobeMap from '@/components/explore/GlobeMap';
import { motion } from 'framer-motion';

const CATEGORIES = [
  'All', 'City Guide', 'Property Walkthrough', 'Shopping Help', 'Event Attendance',
  'Queue & Errands', 'Family Support', 'Business Inspection', 'Training & Coaching',
  'Campus Help', 'Travel Assistance', 'Custom Request'
];

const CATEGORY_ICONS = {
  'All': '🌐', 'City Guide': '🌆', 'Property Walkthrough': '🏠', 'Shopping Help': '🛍️',
  'Event Attendance': '🎫', 'Queue & Errands': '📦', 'Family Support': '👨‍👩‍👧', 
  'Business Inspection': '🏢', 'Training & Coaching': '🎓', 'Campus Help': '🏫', 
  'Travel Assistance': '✈️', 'Custom Request': '✨'
};

export default function Explore() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const dashPath = user?.role === 'avatar' ? '/AvatarDashboard' : user?.role === 'enterprise' ? '/EnterpriseDashboard' : '/UserDashboard';
  const initialCat = urlParams.get('category') || 'All';

  const savedPrefs = (() => { try { return JSON.parse(localStorage.getItem('cotask_user_prefs') || 'null'); } catch { return null; } })();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCat);
  const [city, setCity] = useState('');
  const [showPrefsBanner, setShowPrefsBanner] = useState(!!savedPrefs?.categories?.length);
  const [locationSearch, setLocationSearch] = useState('');
  const [focusCity, setFocusCity] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const { data: avatars = [], isLoading } = useQuery({
    queryKey: ['explore-avatars'],
    queryFn: () => base44.entities.AvatarProfile.filter({ status: 'active' }, '-rating', 50),
  });

  const filtered = avatars.filter(a => {
    const matchSearch = !search || a.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      (a.categories || []).some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchCat = category === 'All' || (a.categories || []).includes(category);
    const matchCity = !city || a.city?.toLowerCase().includes(city.toLowerCase());
    const matchLocation = !focusCity || a.city?.toLowerCase().includes(focusCity.toLowerCase());
    return matchSearch && matchCat && matchCity && matchLocation;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-strong border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Link to={dashPath} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 hover:border-primary/30 transition-colors">
            <div className="flex rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-xs flex items-center gap-1 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground'}`}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode('map')} className={`px-3 py-2 text-xs flex items-center gap-1 ${viewMode === 'map' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground'}`}>
                <Map className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  cat === category ? 'bg-primary text-white' : 'bg-white/5 border border-white/10 text-muted-foreground hover:border-primary/30'
                }`}>
                <span>{CATEGORY_ICONS[cat] || '•'}</span>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Preferences Banner */}
        {showPrefsBanner && savedPrefs && (
          <div className="mb-5 glass rounded-2xl p-4 border border-primary/20 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold mb-2">Based on your preferences</p>
              <div className="flex flex-wrap gap-1.5">
                {savedPrefs.categories.map(cat => (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className="text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors">
                    {cat}
                  </button>
                ))}
                {savedPrefs.location && (
                  <button onClick={() => setCity(savedPrefs.location)}
                    className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {savedPrefs.location}
                  </button>
                )}
              </div>
            </div>
            <button onClick={() => setShowPrefsBanner(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters panel */}
        {showFilters && (
          <div className="glass rounded-2xl p-4 mb-5 border border-white/10 flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Filter by City</label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Any city" className="bg-white/5 border-white/10 h-9 text-sm w-48" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Globe Focus</label>
              <div className="flex gap-2">
                <Input value={locationSearch} onChange={e => setLocationSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { setFocusCity(locationSearch); setViewMode('map'); }}}
                  placeholder="Jump to city on globe..." className="bg-white/5 border-white/10 h-9 text-sm w-48" />
                <Button size="sm" className="h-9" onClick={() => { setFocusCity(locationSearch); setViewMode('map'); }}>
                  Go
                </Button>
              </div>
            </div>
            {(city || focusCity) && (
              <Button size="sm" variant="ghost" className="h-9" onClick={() => { setCity(''); setFocusCity(''); setLocationSearch(''); }}>
                Clear
              </Button>
            )}
          </div>
        )}

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="mb-6 rounded-2xl overflow-hidden">
            <GlobeMap avatars={filtered} focusCity={focusCity} mode="client" />
          </div>
        )}

        {/* Results count */}
        {viewMode === 'grid' && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : `${filtered.length} avatar${filtered.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
        )}

        {/* Grid */}
        {viewMode === 'grid' && isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="glass rounded-2xl p-5 animate-pulse border border-white/5">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/10" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-white/10 rounded w-2/3" />
                    <div className="h-3 bg-white/10 rounded w-1/2" />
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'grid' && filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((avatar, i) => {
              const AvatarCard = () => {
                const { data: isFavorited = false } = useQuery({
                  queryKey: ['is-favorited-explore', user?.email, avatar.id],
                  queryFn: async () => {
                    const favs = await base44.entities.Favorite.filter({ user_email: user.email, avatar_profile_id: avatar.id });
                    return favs.length > 0;
                  },
                  enabled: !!user,
                });

                const toggleFavorite = useMutation({
                  mutationFn: async () => {
                    if (isFavorited) {
                      const favs = await base44.entities.Favorite.filter({ user_email: user.email, avatar_profile_id: avatar.id });
                      if (favs.length > 0) await base44.entities.Favorite.delete(favs[0].id);
                    } else {
                      await base44.entities.Favorite.create({ user_email: user.email, avatar_profile_id: avatar.id, avatar_name: avatar.display_name });
                    }
                  },
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['is-favorited-explore', user?.email, avatar.id] });
                    queryClient.invalidateQueries({ queryKey: ['favorites'] });
                  },
                });

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  >
                    <Link to={`/AvatarView?id=${avatar.id}`}>
                      <div className="glass border border-white/5 hover:border-primary/30 rounded-2xl p-5 h-full transition-all hover:scale-[1.01] group">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0 overflow-hidden relative">
                            {avatar.photo_url
                              ? <img src={avatar.photo_url} alt={avatar.display_name} className="w-full h-full object-cover" />
                              : avatar.display_name?.[0] || 'A'}
                            {avatar.is_available && (
                              <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-card" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold truncate text-sm">{avatar.display_name}</h3>
                              {avatar.is_verified && <Shield className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3" /> {avatar.city || 'Remote'}
                              {avatar.rating > 0 && (
                                <><Star className="w-3 h-3 text-yellow-400 ml-1 flex-shrink-0" />
                                <span>{avatar.rating.toFixed(1)} ({avatar.review_count})</span></>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{avatar.bio || 'Available for bookings'}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(avatar.categories || []).slice(0, 3).map(c => (
                                <span key={c} className="text-xs bg-white/5 border border-white/5 rounded px-2 py-0.5">{c}</span>
                              ))}
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <p className="text-sm font-black text-primary">${avatar.hourly_rate || 30}/hr</p>
                              <button
                                onClick={e => { e.preventDefault(); toggleFavorite.mutate(); }}
                                disabled={toggleFavorite.isPending || !user}
                                className="p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                              >
                                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              };
              return <AvatarCard key={avatar.id} />;
            })}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="glass rounded-2xl p-12 text-center border border-white/5">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-bold mb-2">No avatars found</h3>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filters</p>
            <Button variant="outline" className="border-white/10" onClick={() => { setSearch(''); setCategory('All'); setCity(''); }}>
              Clear filters
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}