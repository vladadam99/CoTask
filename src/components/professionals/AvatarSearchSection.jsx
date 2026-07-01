import React, { useState } from 'react';
import SmartSearchBar from '@/components/search/SmartSearchBar';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Shield, Filter, X, Heart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import SuggestedForYou from '@/components/dashboard/SuggestedForYou';

const CATEGORIES = [
  { label: 'City Guide', icon: '🌆' },
  { label: 'Property Walkthrough', icon: '🏠' },
  { label: 'Shopping Help', icon: '🛍️' },
  { label: 'Event Attendance', icon: '🎫' },
  { label: 'Queue & Errands', icon: '📦' },
  { label: 'Family Support', icon: '👨‍👩‍👧' },
  { label: 'Business Inspection', icon: '🏢' },
  { label: 'Training & Coaching', icon: '🎓' },
  { label: 'Travel Assistance', icon: '✈️' },
  { label: 'Pets & Animals', icon: '🐾' },
  { label: 'Cars & Vehicles', icon: '🚗' },
  { label: 'Mechanics', icon: '🔧' },
  { label: 'Plumbing', icon: '🚿' },
  { label: 'Electrical Work', icon: '⚡' },
  { label: 'Medical & Health', icon: '🏥' },
  { label: 'Outdoors & Nature', icon: '🌿' },
  { label: 'Cleaning', icon: '🧹' },
  { label: 'Gardening', icon: '🌱' },
  { label: 'Pick Ups', icon: '📍' },
  { label: 'Deliveries', icon: '📦' },
  { label: 'Cooking & Food', icon: '🍳' },
  { label: 'Dating & Social', icon: '💬' },
  { label: 'Driving', icon: '🚕' },
  { label: 'Show Me Around', icon: '🗺️' },
  { label: 'Carers & Companionship', icon: '🤝' },
  { label: 'DIY & Repairs', icon: '🛠️' },
  { label: 'Campus Help', icon: '🎓' },
];

export default function AvatarSearchSection({ user }) {
  const queryClient = useQueryClient();
  const [aiMatchedIds, setAiMatchedIds] = useState(null);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  const { data: avatars = [], isLoading } = useQuery({
    queryKey: ['explore-avatars'],
    queryFn: () => base44.entities.AvatarProfile.filter({ status: 'active' }, '-rating', 50),
  });

  const suggestionList = CATEGORIES.filter(c => c.label !== 'All').map(c => c.label);

  const avatarSummaryFn = (a) => [
    a.display_name, a.bio, a.city, a.country,
    (a.categories || []).join(', '),
    (a.skills || []).join(', '),
    (a.languages || []).join(', '),
  ].filter(Boolean).join(' | ');

  const filtered = avatars.filter(a => {
    if (aiMatchedIds !== null) {
      if (!aiMatchedIds.includes(a.id)) return false;
    }
    if (onlineOnly && !a.is_available) return false;
    if (selectedCategories.length > 0 && !selectedCategories.some(c => (a.categories || []).includes(c))) return false;
    return true;
  });

  const sortedFiltered = aiMatchedIds
    ? [...filtered].sort((a, b) => aiMatchedIds.indexOf(a.id) - aiMatchedIds.indexOf(b.id))
    : filtered;

  return (
    <div>
      <div className="mb-4">
        <SmartSearchBar
          items={avatars}
          itemSummaryFn={avatarSummaryFn}
          onResults={setAiMatchedIds}
          placeholder="Search Local Agents, skills, or task types..."
          suggestions={suggestionList}
        />
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setOnlineOnly(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            onlineOnly
              ? 'bg-green-500/20 text-green-400 border-green-500/30'
              : 'bg-secondary/60 text-muted-foreground border-border hover:border-border'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${onlineOnly ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'}`} />
          Online Now
        </button>

        <button
          onClick={() => setShowCategoryFilter(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            selectedCategories.length > 0
              ? 'bg-primary/20 text-primary border-primary/30'
              : 'bg-secondary/60 text-muted-foreground border-border hover:border-border'
          }`}
        >
          <Filter className="w-3 h-3" />
          {selectedCategories.length > 0 ? `${selectedCategories.length} selected` : 'Category'}
          {selectedCategories.length > 0 && (
            <span onClick={e => { e.stopPropagation(); setSelectedCategories([]); }} className="ml-0.5">
              <X className="w-3 h-3" />
            </span>
          )}
        </button>
      </div>

      {showCategoryFilter && (
        <div className="mb-5 surface-panel rounded-lg p-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => {
              const isSelected = selectedCategories.includes(c.label);
              return (
                <button
                  key={c.label}
                  onClick={() => setSelectedCategories(prev =>
                    isSelected ? prev.filter(x => x !== c.label) : [...prev, c.label]
                  )}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <SuggestedForYou user={user} />

      <p className="text-xs text-muted-foreground mb-5">{isLoading ? 'Loading...' : `${sortedFiltered.length} Local Agent${sortedFiltered.length !== 1 ? 's' : ''} found`}</p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="surface-panel rounded-lg h-36 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-panel rounded-lg text-center py-16 px-6 space-y-3">
          <h3 className="font-bold">No local agents found</h3>
          <p className="text-sm text-muted-foreground">Try another skill, location, or clear the active filters.</p>
          <Button variant="outline" className="border-border" onClick={() => { setOnlineOnly(false); setSelectedCategories([]); setAiMatchedIds(null); }}>Clear filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sortedFiltered.map((avatar, i) => <AvatarCard key={avatar.id} avatar={avatar} i={i} user={user} queryClient={queryClient} />)}
        </div>
      )}
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
      <div className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        <Link to={`/AvatarView?id=${avatar.id}`} className="absolute inset-0 z-0"></Link>
        <div className="relative z-10 pointer-events-none">
          <div className="relative aspect-[4/3] bg-secondary">
            {avatar.photo_url ? (
              <img src={avatar.photo_url} alt={avatar.display_name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-4xl font-black text-primary">
                {avatar.display_name?.[0] || 'A'}
              </div>
            )}
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
              {avatar.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-800 shadow-sm">
                  <Shield className="h-3 w-3 text-blue-600" /> Verified
                </span>
              )}
              {avatar.is_available && (
                <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Available
                </span>
              )}
            </div>
          </div>
          {user && (
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFav.mutate(); }} disabled={toggleFav.isPending}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-white/90 shadow-sm pointer-events-auto z-20">
              <Heart className={`h-4 w-4 ${isFavorited ? 'fill-primary text-primary' : 'text-slate-600'}`} />
            </button>
          )}
          <div className="space-y-3 p-4">
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-base font-bold">{avatar.display_name}</p>
                {avatar.rating > 0 && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-semibold">{avatar.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {avatar.city || 'Remote'}{avatar.country ? `, ${avatar.country}` : ''}
              </div>
            </div>

            {(avatar.bio || (avatar.categories?.length > 0)) && (
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {avatar.bio || (avatar.categories || []).join(', ')}
              </p>
            )}
            {avatar.categories?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(avatar.categories || []).slice(0, 3).map(c => (
                  <span key={c} className="rounded-full border border-border bg-secondary/60 px-2 py-1 text-[11px] font-semibold text-muted-foreground">{c}</span>
                ))}
              </div>
            )}

            <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
              <div>
                <p className="text-xs text-muted-foreground">Starts at</p>
                <p className="text-base font-black text-foreground">${avatar.hourly_rate || 30}/hr</p>
              </div>
              <Button variant="outline" className="relative z-20 h-9 shrink-0 gap-1 text-xs pointer-events-auto" asChild>
                <Link to={`/AvatarView?id=${avatar.id}`}>View Profile <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
