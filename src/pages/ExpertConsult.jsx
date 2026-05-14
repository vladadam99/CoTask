import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { Button } from '@/components/ui/button';
import { Search, Star, Clock, BookOpen, MessageSquare, Zap, Shield, MapPin, X } from 'lucide-react';
import { motion } from 'framer-motion';

const TOPICS = [
  { label: 'All', icon: '✨' },
  { label: 'Technology', icon: '💻' },
  { label: 'Business', icon: '📈' },
  { label: 'Language Learning', icon: '🌍' },
  { label: 'Health & Wellness', icon: '🏃' },
  { label: 'Creative Arts', icon: '🎨' },
  { label: 'Finance', icon: '💰' },
  { label: 'Law & Legal', icon: '⚖️' },
  { label: 'Education', icon: '🎓' },
  { label: 'Marketing', icon: '📣' },
  { label: 'Science', icon: '🔬' },
  { label: 'Cooking', icon: '🍳' },
  { label: 'Music', icon: '🎵' },
  { label: 'Career Advice', icon: '🧭' },
  { label: 'Other', icon: '💡' },
];

const SESSION_TYPE_LABELS = {
  consultation: 'Consultation',
  class: 'Class',
  coaching: 'Coaching',
  qa_session: 'Q&A Session',
  mentoring: 'Mentoring',
};

const SESSION_TYPE_ICONS = {
  consultation: '💬',
  class: '📚',
  coaching: '🎯',
  qa_session: '❓',
  mentoring: '🧠',
};

export default function ExpertConsult() {
  const { user } = useCurrentUser();
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [onlineOnly, setOnlineOnly] = useState(false);

  const { data: offerings = [], isLoading } = useQuery({
    queryKey: ['expertise-offerings', selectedTopic],
    queryFn: () => {
      if (selectedTopic === 'All') {
        return base44.entities.ExpertiseOffering.filter({ is_active: true }, '-created_date', 100);
      }
      return base44.entities.ExpertiseOffering.filter({ is_active: true, topic: selectedTopic }, '-created_date', 100);
    },
  });

  const { data: avatarProfiles = [] } = useQuery({
    queryKey: ['avatar-profiles-for-consult'],
    queryFn: () => base44.entities.AvatarProfile.filter({ status: 'active' }, '-rating', 200),
  });

  const avatarMap = Object.fromEntries(avatarProfiles.map(a => [a.user_email, a]));

  const filtered = offerings.filter(o => {
    const avatar = avatarMap[o.avatar_email];
    if (onlineOnly && !avatar?.is_available) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.title?.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q) ||
        o.topic?.toLowerCase().includes(q) ||
        o.avatar_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <AppShell navItems={getNavItems(user?.selected_role)} user={user}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black mb-1">Find an Expert</h1>
          <p className="text-sm text-muted-foreground">Book a 1-on-1 call, class, or Q&A session with a verified expert</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by topic, skill, or expert name..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-card/50 border border-white/10 text-sm focus:outline-none focus:border-primary/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setOnlineOnly(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              onlineOnly
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${onlineOnly ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'}`} />
            Available Now
          </button>
        </div>

        {/* Topic chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6" style={{ scrollbarWidth: 'none' }}>
          {TOPICS.map(t => (
            <button
              key={t.label}
              onClick={() => setSelectedTopic(t.label)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border whitespace-nowrap transition-all flex-shrink-0 ${
                selectedTopic === t.label
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20'
              }`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Count */}
        <p className="text-xs text-muted-foreground mb-4">
          {isLoading ? 'Loading...' : `${filtered.length} expert session${filtered.length !== 1 ? 's' : ''} found`}
        </p>

        {/* Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-2xl bg-card/40 border border-white/5 h-48 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-4xl">🔍</p>
            <h3 className="font-bold">No sessions found</h3>
            <p className="text-sm text-muted-foreground">Try a different topic or clear your filters</p>
            <Button variant="outline" className="border-white/10" onClick={() => { setSearch(''); setSelectedTopic('All'); setOnlineOnly(false); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((offering, i) => {
              const avatar = avatarMap[offering.avatar_email];
              return (
                <OfferingCard key={offering.id} offering={offering} avatar={avatar} i={i} />
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function OfferingCard({ offering, avatar, i }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.3) }}>
      <Link to={`/AvatarView?id=${offering.avatar_profile_id}&tab=Expertise`}>
        <div className="glass border border-white/5 hover:border-primary/30 rounded-2xl p-5 transition-all hover:scale-[1.02] flex flex-col gap-4">
          {/* Session type badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {SESSION_TYPE_ICONS[offering.session_type]} {SESSION_TYPE_LABELS[offering.session_type] || offering.session_type}
            </span>
            {avatar?.is_available && (
              <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Available
              </span>
            )}
          </div>

          {/* Title & description */}
          <div>
            <h3 className="font-bold text-sm leading-snug mb-1">{offering.title}</h3>
            {offering.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{offering.description}</p>
            )}
          </div>

          {/* Expert info */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary overflow-hidden flex-shrink-0">
              {offering.avatar_photo_url
                ? <img src={offering.avatar_photo_url} alt={offering.avatar_name} className="w-full h-full object-cover" />
                : offering.avatar_name?.[0] || 'A'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold truncate">{offering.avatar_name}</p>
                {avatar?.is_verified && <Shield className="w-3 h-3 text-blue-400 flex-shrink-0" />}
              </div>
              {avatar?.city && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" /> {avatar.city}
                </p>
              )}
            </div>
            {avatar?.rating > 0 && (
              <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs">{avatar.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" /> {offering.duration_minutes} min
            </div>
            <span className="text-base font-black text-primary">
              ${offering.rate}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}