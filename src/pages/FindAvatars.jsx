import React, { useState, useRef, useMemo } from 'react';
import SmartSearchBar from '@/components/search/SmartSearchBar';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Star, Shield, Filter, X, Heart, ArrowLeft, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { getNavItems } from '@/lib/navItems';
import AppShell from '@/components/layout/AppShell';
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

export default function FindAvatars() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [aiMatchedIds, setAiMatchedIds] = useState(null);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const searchRef = useRef(null);

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

  // If AI matched, sort by match order
  const sortedFiltered = aiMatchedIds
    ? [...filtered].sort((a, b) => aiMatchedIds.indexOf(a.id) - aiMatchedIds.indexOf(b.id))
    : filtered;

  return (
    <AppShell navItems={getNavItems(user?.selected_role)} user={user}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-black">Find Avatars</h1>
        </div>

        {/* Search */}
        <div className="mb-4">
          <SmartSearchBar
            items={avatars}
            itemSummaryFn={avatarSummaryFn}
            onResults={setAiMatchedIds}
            placeholder="Search avatars, skills, tasks... (AI-powered)"
            suggestions={suggestionList}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Online Now toggle */}
          <button
            onClick={() => setOnlineOnly(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              onlineOnly
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${onlineOnly ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'}`} />
            Online Now
          </button>

          {/* Category filter */}
          <button
            onClick={() => setShowCategoryFilter(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              selectedCategories.length > 0
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20'
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

        {/* Category picker */}
        {showCategoryFilter && (
          <div className="mb-5 p-3 rounded-2xl bg-card/40 border border-white/5">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => {
                const isSelected = selectedCategories.includes(c.label);
                return (
                  <button
                    key={c.label}
                    onClick={() => setSelectedCategories(prev =>
                      isSelected ? prev.filter(x => x !== c.label) : [...prev, c.label]
                    )}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all ${
                      isSelected
                        ? 'bg-primary/20 text-primary border-primary/30'
                        : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span>{c.icon}</span> {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <SuggestedForYou user={user} />

        <p className="text-xs text-muted-foreground mb-5">{isLoading ? 'Loading...' : `${sortedFiltered.length} avatars found`}</p>

        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
              <div key={i} className="flex flex-col items-center gap-2 p-2">
                <div className="w-16 h-16 rounded-full bg-card/60 animate-pulse" />
                <div className="w-12 h-2.5 rounded bg-card/60 animate-pulse" />
                <div className="w-8 h-2 rounded bg-card/60 animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-3xl">🔍</p>
            <h3 className="font-bold">No avatars found</h3>
            <Button variant="outline" className="border-white/10" onClick={() => { setOnlineOnly(false); setSelectedCategories([]); setAiMatchedIds(null); }}>Clear filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {sortedFiltered.map((avatar, i) => <AvatarCard key={avatar.id} avatar={avatar} i={i} user={user} queryClient={queryClient} />)}
          </div>
        )}
      </div>
    </AppShell>
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
      <Link to={`/AvatarView?id=${avatar.id}`}>
        <div className="group flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-card/60 transition-all duration-200">
          {/* Avatar photo */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-primary/40 transition-all bg-primary/20 flex items-center justify-center flex-shrink-0">
              {avatar.photo_url
                ? <img src={avatar.photo_url} alt={avatar.display_name} className="w-full h-full object-cover" />
                : <span className="text-2xl font-black text-primary/60">{avatar.display_name?.[0] || 'A'}</span>}
            </div>
            {avatar.is_available && (
              <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-background" />
            )}
            {avatar.is_verified && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                <Shield className="w-2.5 h-2.5 text-white" />
              </span>
            )}
            {user && (
              <button onClick={e => { e.preventDefault(); toggleFav.mutate(); }} disabled={toggleFav.isPending}
                className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-black/50 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Heart className={`w-2.5 h-2.5 ${isFavorited ? 'fill-primary text-primary' : 'text-white'}`} />
              </button>
            )}
          </div>
          {/* Name & rate */}
          <div className="text-center w-full">
            <p className="text-xs font-semibold truncate leading-tight">{avatar.display_name}</p>
            <p className="text-[10px] text-primary font-bold">${avatar.hourly_rate || 30}/hr</p>
            {avatar.rating > 0 && (
              <div className="flex items-center justify-center gap-0.5 mt-0.5">
                <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] text-muted-foreground">{avatar.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}