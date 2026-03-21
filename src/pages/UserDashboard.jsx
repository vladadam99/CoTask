import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Search, Calendar, MessageSquare, Radio, Heart, User,
  ArrowRight, MapPin, Star, Play
} from 'lucide-react';

const navItems = [
  { icon: Search, label: 'Explore', path: '/Explore' },
  { icon: Radio, label: 'Live', path: '/LiveSessions' },
  { icon: Calendar, label: 'Bookings', path: '/Bookings' },
  { icon: MessageSquare, label: 'Messages', path: '/Messages' },
  { icon: Heart, label: 'Saved', path: '/Saved' },
  { icon: User, label: 'Profile', path: '/Profile' },
];

const CATEGORIES = [
  { name: 'City Guide', icon: '🌆' },
  { name: 'Property Walkthrough', icon: '🏠' },
  { name: 'Shopping Help', icon: '🛍️' },
  { name: 'Event Attendance', icon: '🎫' },
  { name: 'Queue & Errands', icon: '📦' },
  { name: 'Business Inspection', icon: '🏢' },
  { name: 'Travel Assistance', icon: '✈️' },
  { name: 'Training & Coaching', icon: '🎓' },
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

  if (userLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const firstName = user?.full_name?.split(' ')[0] || '';

  return (
    <AppShell navItems={navItems} user={user}>
      {/* Header + Primary CTA */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1">
          {firstName ? `Hey, ${firstName}` : 'Welcome back'} 👋
        </h1>
        <p className="text-muted-foreground text-sm mb-5">What can we help you with today?</p>
        <Link to="/LiveSessions">
          <Button size="lg" className="bg-primary hover:bg-primary/90 glow-primary-sm text-base px-8">
            <Play className="w-5 h-5 mr-2" /> Watch Live
          </Button>
        </Link>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Browse by Category</h2>
          <Link to="/Explore" className="text-sm text-primary hover:underline flex items-center gap-1">
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map(cat => (
            <Link key={cat.name} to={`/Explore?category=${encodeURIComponent(cat.name)}`}>
              <GlassCard className="p-4 text-center" hover>
                <span className="text-2xl mb-2 block">{cat.icon}</span>
                <span className="text-xs font-medium">{cat.name}</span>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Avatars */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">
            {user?.interests?.length ? 'Recommended for You' : 'Featured Avatars'}
          </h2>
          <Link to="/Explore" className="text-sm text-primary hover:underline flex items-center gap-1">
            Browse all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {avatars.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {avatars.map(avatar => (
              <Link key={avatar.id} to={`/AvatarView?id=${avatar.id}`}>
                <GlassCard className="p-5" hover>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0 overflow-hidden">
                      {avatar.photo_url
                        ? <img src={avatar.photo_url} alt={avatar.display_name} className="w-full h-full object-cover" />
                        : avatar.display_name?.[0] || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{avatar.display_name}</h3>
                        {avatar.is_verified && <span className="text-blue-400 text-xs">✓</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" /> {avatar.city || 'Remote'}
                        {avatar.rating > 0 && (
                          <><Star className="w-3 h-3 text-yellow-400 ml-2" /> {avatar.rating.toFixed(1)}</>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(avatar.categories || []).slice(0, 2).map(c => (
                          <span key={c} className="text-xs bg-muted/50 rounded-md px-2 py-0.5">{c}</span>
                        ))}
                      </div>
                      <p className="text-xs text-primary font-medium mt-2">${avatar.hourly_rate || 30}/hr</p>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        ) : (
          <GlassCard className="p-8 text-center">
            <p className="text-muted-foreground text-sm mb-4">No featured avatars yet.</p>
            <Link to="/Explore">
              <Button size="sm" className="bg-primary hover:bg-primary/90">Explore Avatars</Button>
            </Link>
          </GlassCard>
        )}
      </div>

      {/* Recent Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Recent Bookings</h2>
          <Link to="/Bookings" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.map(b => (
              <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
                <GlassCard className="p-4 flex items-center justify-between" hover>
                  <div>
                    <p className="font-medium text-sm">{b.category}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {b.avatar_name} · {b.scheduled_date || 'Pending'}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </GlassCard>
              </Link>
            ))}
          </div>
        ) : (
          <GlassCard className="p-8 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">No bookings yet</p>
            <Link to="/Explore">
              <Button size="sm" className="bg-primary hover:bg-primary/90">Book your first avatar</Button>
            </Link>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}