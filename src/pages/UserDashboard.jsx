import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { getNavItems } from '@/lib/navItems';
import {
  Search, Calendar, MessageSquare, Radio, Heart, User,
  ArrowRight, MapPin, Star, Play, Zap, Briefcase
} from 'lucide-react';
import SuggestedForYou from '@/components/dashboard/SuggestedForYou';
import { motion } from 'framer-motion';



const CATEGORIES = [
  { name: 'City Guide', icon: '🌆' },
  { name: 'Property Walkthrough', icon: '🏠' },
  { name: 'Shopping Help', icon: '🛍️' },
  { name: 'Event Attendance', icon: '🎫' },
  { name: 'Queue & Errands', icon: '📦' },
  { name: 'Business Inspection', icon: '🏢' },
  { name: 'Travel Assistance', icon: '✈️' },
  { name: 'Training & Coaching', icon: '🎓' },
  { name: 'Pets & Animals', icon: '🐾' },
  { name: 'Cars & Vehicles', icon: '🚗' },
  { name: 'Mechanics', icon: '🔧' },
  { name: 'Plumbing', icon: '🚿' },
  { name: 'Electrical Work', icon: '⚡' },
  { name: 'Medical & Health', icon: '🏥' },
  { name: 'Outdoors & Nature', icon: '🌿' },
  { name: 'Cleaning', icon: '🧹' },
  { name: 'Gardening', icon: '🌱' },
  { name: 'Pick Ups', icon: '📍' },
  { name: 'Deliveries', icon: '📦' },
  { name: 'Cooking & Food', icon: '🍳' },
  { name: 'Dating & Social', icon: '💬' },
  { name: 'Driving', icon: '🚕' },
  { name: 'Show Me Around', icon: '🗺️' },
  { name: 'Carers & Companionship', icon: '🤝' },
  { name: 'DIY & Repairs', icon: '🛠️' },
  { name: 'Family Support', icon: '👨‍👩‍👧' },
  { name: 'Campus Help', icon: '🎓' },
];

export default function UserDashboard() {
  const { user, loading: userLoading } = useCurrentUser();

  const { data: bookings = [] } = useQuery({
    queryKey: ['user-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ client_email: user?.email }, '-created_date', 5),
    enabled: !!user,
  });

  const { data: avatars = [] } = useQuery({
    queryKey: ['featured-avatars'],
    queryFn: () => base44.entities.AvatarProfile.filter({ is_featured: true, status: 'active' }, '-rating', 6),
  });

  const { data: liveAvatars = [] } = useQuery({
    queryKey: ['live-avatars-dash'],
    queryFn: () => base44.entities.AvatarProfile.filter({ is_available: true, status: 'active' }, '-rating', 4),
  });

  if (userLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const firstName = user?.full_name?.split(' ')[0] || '';

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-black mb-1">
          {firstName ? `Hey, ${firstName} 👋` : 'Welcome back 👋'}
        </h1>
        <p className="text-muted-foreground text-sm mb-5">What do you need help with today?</p>

        {/* Primary CTAs */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link to="/FindAvatars" className="min-w-0">
            <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 glow-primary-sm font-bold">
              <Zap className="w-4 h-4 flex-shrink-0" /> Book an Avatar
            </Button>
          </Link>

          <Link to="/PostJob" className="min-w-0">
            <Button variant="outline" className="w-full sm:w-auto border-primary/30 text-primary font-semibold">
              <Briefcase className="w-4 h-4 flex-shrink-0" /> Post a Job
            </Button>
          </Link>
        </div>
      </motion.div>

      <SuggestedForYou user={user} />

      {/* Live Now Strip */}
      {liveAvatars.length > 0 && (
        <div className="mb-8 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <h2 className="text-base font-bold">Live Now</h2>
            </div>
            <Link to="/LiveSessions" className="text-sm text-primary flex items-center gap-1 hover:underline">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{scrollbarWidth:'none',msOverflowStyle:'none'}}>
            {liveAvatars.map(avatar => (
              <Link key={avatar.id} to={`/AvatarView?id=${avatar.id}`} className="flex-shrink-0">
                <div className="glass border border-white/5 rounded-2xl p-4 w-44 hover:border-primary/30 transition-all">
                  <div className="relative mb-3">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary mx-auto overflow-hidden">
                      {avatar.photo_url
                        ? <img src={avatar.photo_url} alt={avatar.display_name} className="w-full h-full object-cover" />
                        : avatar.display_name?.[0] || 'A'}
                    </div>
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">LIVE</span>
                  </div>
                  <p className="text-xs font-semibold text-center truncate">{avatar.display_name}</p>
                  <p className="text-xs text-muted-foreground text-center truncate">{avatar.city || 'Remote'}</p>
                  {avatar.rating > 0 && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs">{avatar.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">Browse by Category</h2>
          <Link to="/Explore" className="text-sm text-primary hover:underline flex items-center gap-1">
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
          {CATEGORIES.map((cat, i) => (
            <motion.div key={cat.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
              <Link to={`/Explore?category=${encodeURIComponent(cat.name)}`}
                className="glass border border-white/5 hover:border-primary/30 rounded-2xl p-3 text-center block transition-all hover:scale-105">
                <span className="text-2xl mb-1.5 block">{cat.icon}</span>
                <span className="text-[10px] font-medium leading-tight text-muted-foreground">{cat.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Featured Avatars */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">Featured Avatars</h2>
          <Link to="/Explore" className="text-sm text-primary hover:underline flex items-center gap-1">
            Browse all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {avatars.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {avatars.map(avatar => (
              <Link key={avatar.id} to={`/AvatarView?id=${avatar.id}`}>
                <div className="glass border border-white/5 hover:border-primary/30 rounded-2xl p-5 transition-all hover:scale-[1.01] group">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0 overflow-hidden">
                      {avatar.photo_url
                        ? <img src={avatar.photo_url} alt={avatar.display_name} className="w-full h-full object-cover" />
                        : avatar.display_name?.[0] || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm truncate">{avatar.display_name}</h3>
                        {avatar.is_verified && <span className="text-blue-400 text-xs">✓</span>}
                        {avatar.is_available && <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" /> {avatar.city || 'Remote'}
                        {avatar.rating > 0 && (
                          <><Star className="w-3 h-3 text-yellow-400 ml-1" /> {avatar.rating.toFixed(1)}</>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(avatar.categories || []).slice(0, 2).map(c => (
                          <span key={c} className="text-xs bg-white/5 border border-white/5 rounded px-2 py-0.5">{c}</span>
                        ))}
                      </div>
                      <p className="text-sm font-bold text-primary mt-2">${avatar.hourly_rate || 30}/hr</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 text-center border border-white/5">
            <p className="text-muted-foreground text-sm mb-4">No featured avatars yet.</p>
            <Link to="/Explore">
              <Button size="sm" className="bg-primary hover:bg-primary/90">Explore Avatars</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">Recent Bookings</h2>
          <Link to="/Bookings" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.map(b => (
              <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
                <div className="glass border border-white/5 hover:border-primary/30 rounded-2xl p-4 flex items-center justify-between transition-all">
                  <div>
                    <p className="font-semibold text-sm">{b.category}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {b.avatar_name} · {b.scheduled_date || 'Pending'}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 text-center border border-white/5">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No bookings yet</p>
            <Link to="/Explore">
              <Button size="sm" className="bg-primary hover:bg-primary/90">Book your first avatar</Button>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}