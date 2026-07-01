import React, { useState } from 'react';
import SmartSearchBar from '@/components/search/SmartSearchBar';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Shield, Filter, X, Heart } from 'lucide-react';
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
          placeholder="Search agents, skills, tasks... (AI-powered)"
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
        <div className="mb-5 p-3 rounded-2xl bg-card/40 border border-border">
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
                      : 'bg-secondary/60 text-muted-foreground border-border hover:border-border'
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

      <p className="text-xs text-muted-foreground mb-5">{isLoading ? 'Loading...' : `${sortedFiltered.length} local agents found`}</p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="rounded-2xl bg-card/40 border border-border h-32 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-3xl">🔍</p>
          <h3 className="font-bold">No local agents found</h3>
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
      <div className="glass border border-border hover:border-primary/30 rounded-2xl p-4 transition-all hover:scale-[1.02] relative group">
        <Link to={`/AvatarView?id=${avatar.id}`} className="absolute inset-0 z-0"></Link>
        <div className="relative z-10 pointer-events-none">
          {user && (
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFav.mutate(); }} disabled={toggleFav.isPending}
              className="absolute top-0 right-0 w-6 h-6 rounded-full bg-black/30 backdrop-blur flex items-center justify-center pointer-events-auto z-20">
              <Heart className={`w-3 h-3 ${isFavorited ? 'fill-primary text-primary' : 'text-white/60'}`} />
            </button>
          )}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary overflow-hidden">
                {avatar.photo_url
                  ? <img src={avatar.photo_url} alt={avatar.display_name} className="w-full h-full object-cover" />
                  : avatar.display_name?.[0] || 'A'}
              </div>
              {avatar.is_available && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-background" />
              )}
              {avatar.is_verified && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <Shield className="w-2.5 h-2.5 text-white" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{avatar.display_name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" /> {avatar.city || 'Remote'}
              </div>
            </div>
          </div>
          {(avatar.bio || (avatar.categories?.length > 0)) && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {avatar.bio || (avatar.categories || []).join(', ')}
            </p>
          )}
          {avatar.categories?.length > 0 && avatar.bio && (
            <div className="flex flex-wrap gap-1 mb-2">
              {(avatar.categories || []).slice(0, 2).map(c => (
                <span key={c} className="text-[10px] bg-secondary/60 border border-border rounded px-1.5 py-0.5">{c}</span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-primary">${avatar.hourly_rate || 30}/hr</span>
            {avatar.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs">{avatar.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 relative z-20 pointer-events-auto">
            <Button variant="outline" className="w-full h-8 text-xs" asChild>
              <Link to={`/AvatarView?id=${avatar.id}`}>View Profile & Portfolio</Link>
            </Button>
            <Button className="w-full h-8 text-xs" asChild>
              <Link to={`/CreateBooking?avatar=${avatar.id}`} title="Send a Direct Hire request to this specific Local Agent.">Request Direct Hire</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}