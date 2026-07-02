import React, { useState } from 'react';
import SmartSearchBar from '@/components/search/SmartSearchBar';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  Search,
  Shield,
  SlidersHorizontal,
  Star,
  WalletCards,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  'Property Walkthrough',
  'Business Inspection',
  'Queue & Errands',
  'Shopping Help',
  'Deliveries',
  'Travel Assistance',
  'Event Attendance',
  'Cars & Vehicles',
  'City Guide',
  'DIY & Repairs',
];

const quickNeeds = [
  { title: 'Apartment check', category: 'Property Walkthrough', hint: 'Viewings, photos, noise, building access' },
  { title: 'Local proof', category: 'Business Inspection', hint: 'Verify a place, product, venue, or queue' },
  { title: 'Errand help', category: 'Queue & Errands', hint: 'Pickup, delivery, shopping, documents' },
];

export default function AvatarSearchSection({ user }) {
  const queryClient = useQueryClient();
  const [aiMatchedIds, setAiMatchedIds] = useState(null);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const { data: avatars = [], isLoading } = useQuery({
    queryKey: ['explore-avatars'],
    queryFn: () => base44.entities.AvatarProfile.filter({ status: 'active' }, '-rating', 50),
  });

  const avatarSummaryFn = (a) => [
    a.display_name,
    a.bio,
    a.city,
    a.country,
    (a.categories || []).join(', '),
    (a.skills || []).join(', '),
    (a.languages || []).join(', '),
  ].filter(Boolean).join(' | ');

  const filtered = avatars.filter((avatar) => {
    if (aiMatchedIds !== null && !aiMatchedIds.includes(avatar.id)) return false;
    if (availableOnly && !avatar.is_available) return false;
    if (selectedCategories.length > 0 && !selectedCategories.some((category) => (avatar.categories || []).includes(category))) return false;
    return true;
  });

  const sortedFiltered = aiMatchedIds
    ? [...filtered].sort((a, b) => aiMatchedIds.indexOf(a.id) - aiMatchedIds.indexOf(b.id))
    : filtered;

  const toggleCategory = (category) => {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category]
    );
  };

  const clearFilters = () => {
    setAvailableOnly(false);
    setSelectedCategories([]);
    setAiMatchedIds(null);
  };

  return (
    <div className="space-y-5">
      <section className="surface-panel rounded-lg p-4 md:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <Search className="h-4 w-4 text-primary" />
              Tell CoTask what you need
            </div>
            <SmartSearchBar
              items={avatars}
              itemSummaryFn={avatarSummaryFn}
              onResults={setAiMatchedIds}
              placeholder="Search by task, city, skill, or outcome..."
              suggestions={CATEGORIES}
            />
          </div>
          <button
            onClick={() => setAvailableOnly((value) => !value)}
            className={`flex h-12 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition-all ${
              availableOnly
                ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300'
                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${availableOnly ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
            Available now
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const selected = selectedCategories.includes(category);
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`rounded-full border px-3 py-2 text-xs font-bold transition-all ${
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-secondary/60 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {category}
              </button>
            );
          })}
          {(selectedCategories.length > 0 || availableOnly || aiMatchedIds !== null) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <aside className="space-y-4">
          <div className="surface-panel rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Common starts
            </div>
            <div className="mt-3 space-y-2">
              {quickNeeds.map((item) => (
                <button
                  key={item.title}
                  onClick={() => toggleCategory(item.category)}
                  className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/30 hover:bg-secondary/60"
                >
                  <p className="text-sm font-bold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="surface-panel rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <WalletCards className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Want proposals?</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Post one open task and let qualified agents respond before you fund Secure Payment.
                </p>
              </div>
            </div>
            <Button asChild className="mt-4 w-full">
              <Link to="/PostJob">Post Open Task</Link>
            </Button>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-label">Available people</p>
              <h3 className="text-xl font-black tracking-tight text-foreground">Local Agents</h3>
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              {isLoading ? 'Loading agents...' : `${sortedFiltered.length} result${sortedFiltered.length === 1 ? '' : 's'}`}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="surface-panel h-80 rounded-lg animate-pulse" />)}
            </div>
          ) : sortedFiltered.length === 0 ? (
            <div className="surface-panel rounded-lg px-6 py-16 text-center">
              <h3 className="text-lg font-black text-foreground">No local agents found</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Try a broader search, clear filters, or post an open task so agents can come to you.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                <Button variant="outline" className="border-border" onClick={clearFilters}>Clear filters</Button>
                <Button asChild><Link to="/PostJob">Post Open Task</Link></Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sortedFiltered.map((avatar, i) => <AvatarCard key={avatar.id} avatar={avatar} i={i} user={user} queryClient={queryClient} />)}
            </div>
          )}
        </section>
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

  const rating = Number(avatar.rating || 0);
  const categories = avatar.categories || [];
  const location = [avatar.city, avatar.country].filter(Boolean).join(', ') || 'Remote / flexible';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.035, 0.25) }}>
      <div className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
        <Link to={`/AvatarView?id=${avatar.id}`} className="absolute inset-0 z-0" aria-label={`View ${avatar.display_name || 'agent'} profile`} />
        <div className="relative z-10 pointer-events-none">
          <div className="relative aspect-[4/3] bg-secondary">
            {avatar.photo_url ? (
              <img src={avatar.photo_url} alt={avatar.display_name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-4xl font-black text-primary">
                {avatar.display_name?.[0] || 'A'}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent" />
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
              {avatar.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/90 px-2.5 py-1 text-[11px] font-black text-slate-800 shadow-sm">
                  <Shield className="h-3 w-3 text-primary" /> Verified
                </span>
              )}
              {avatar.is_available && (
                <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-black text-green-700 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Available
                </span>
              )}
            </div>
          </div>

          {user && (
            <button
              onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggleFav.mutate(); }}
              disabled={toggleFav.isPending}
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-white/90 shadow-sm pointer-events-auto"
              aria-label={isFavorited ? 'Remove saved agent' : 'Save agent'}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? 'fill-primary text-primary' : 'text-slate-600'}`} />
            </button>
          )}

          <div className="space-y-3 p-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h4 className="truncate text-base font-black text-foreground">{avatar.display_name || 'Local Agent'}</h4>
                {rating > 0 && (
                  <div className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2 py-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold">{rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {location}
              </div>
            </div>

            <p className="line-clamp-2 min-h-[40px] text-sm leading-relaxed text-muted-foreground">
              {avatar.bio || categories.join(', ') || 'Available for local checks, proof, and live assistance.'}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {categories.slice(0, 3).map((category) => (
                <span key={category} className="rounded-full border border-border bg-secondary/60 px-2 py-1 text-[11px] font-bold text-muted-foreground">
                  {category}
                </span>
              ))}
              {avatar.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">
                  <CheckCircle2 className="h-3 w-3" /> ID checked
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
              <div className="rounded-lg bg-secondary/55 px-3 py-2">
                <p className="text-muted-foreground">Starts at</p>
                <p className="mt-0.5 text-base font-black text-foreground">${avatar.hourly_rate || 30}/hr</p>
              </div>
              <div className="rounded-lg bg-secondary/55 px-3 py-2">
                <p className="text-muted-foreground">Response</p>
                <p className="mt-1 inline-flex items-center gap-1 font-black text-foreground">
                  <Clock className="h-3 w-3 text-primary" /> Today
                </p>
              </div>
            </div>

            <Button variant="outline" className="relative z-20 h-10 w-full gap-1 text-sm font-bold pointer-events-auto" asChild>
              <Link to={`/AvatarView?id=${avatar.id}`}>View Profile <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

