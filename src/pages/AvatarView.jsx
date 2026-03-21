import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import AppShell from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, MapPin, Star, Shield, Clock, Globe, Radio, Smartphone,
  Wifi, Headphones, Car, Calendar, MessageSquare, Heart, Loader2
} from 'lucide-react';
import { getNavItems } from '@/lib/navItems';

export default function AvatarView() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const [messaging, setMessaging] = useState(false);

  const { data: avatar, isLoading } = useQuery({
    queryKey: ['avatar', id],
    queryFn: async () => {
      const list = await base44.entities.AvatarProfile.filter({ id });
      return list[0] || null;
    },
    enabled: !!id,
  });

  const startMessage = async () => {
    setMessaging(true);
    try {
      const user = await base44.auth.me();
      const senderName = user.full_name || user.email;

      // Check if a direct conversation already exists between these two users
      const existing = await base44.entities.Conversation.filter({ booking_id: `direct_${user.email}_${avatar.user_email}` });
      if (existing.length > 0) {
        navigate(`/Messages?conversation=${existing[0].id}`);
        return;
      }

      // Create a new pre-booking direct conversation
      const convo = await base44.entities.Conversation.create({
        participant_emails: [user.email, avatar.user_email],
        participant_names: [senderName, avatar.display_name],
        booking_id: `direct_${user.email}_${avatar.user_email}`,
        last_message: 'Conversation started.',
        last_message_at: new Date().toISOString(),
        last_message_by: 'system',
        unread_by: [avatar.user_email],
      });
      navigate(`/Messages?conversation=${convo.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setMessaging(false);
    }
  };

  const { data: reviews = [] } = useQuery({
    queryKey: ['avatar-reviews', avatar?.user_email],
    queryFn: () => base44.entities.Review.filter({ avatar_email: avatar.user_email }, '-created_date', 10),
    enabled: !!avatar,
  });

  const { data: isFavorited = false } = useQuery({
    queryKey: ['is-favorited', user?.email, id],
    queryFn: async () => {
      const favs = await base44.entities.Favorite.filter({
        user_email: user.email,
        avatar_profile_id: id,
      });
      return favs.length > 0;
    },
    enabled: !!user && !!id,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        const favs = await base44.entities.Favorite.filter({
          user_email: user.email,
          avatar_profile_id: id,
        });
        if (favs.length > 0) await base44.entities.Favorite.delete(favs[0].id);
      } else {
        await base44.entities.Favorite.create({
          user_email: user.email,
          avatar_profile_id: id,
          avatar_name: avatar.display_name,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-favorited', user?.email, id] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  if (isLoading) return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    </AppShell>
  );

  if (!avatar) return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="flex items-center justify-center h-64">
        <GlassCard className="p-8 text-center max-w-md">
          <p className="text-muted-foreground mb-4">Avatar not found</p>
          <Link to="/Explore"><Button variant="outline">Back to Explore</Button></Link>
        </GlassCard>
      </div>
    </AppShell>
  );

  const equipment = [
    { key: 'has_smartphone', icon: Smartphone, label: 'Smartphone' },
    { key: 'has_data_connection', icon: Wifi, label: 'Data Connection' },
    { key: 'has_headset', icon: Headphones, label: 'Headset/Glasses' },
    { key: 'has_360_camera', icon: Radio, label: '360° Camera' },
    { key: 'has_vehicle', icon: Car, label: 'Vehicle' },
  ].filter(e => avatar[e.key]);

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary/10 to-transparent rounded-2xl pt-6 pb-12 px-6 mb-0">
          <Link to="/Explore" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Explore
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary flex-shrink-0">
              {avatar.display_name?.[0] || 'A'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{avatar.display_name}</h1>
                {avatar.is_verified && (
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    <Shield className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                )}
                {avatar.is_available && (
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Available</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {avatar.city || 'Remote'}{avatar.country ? `, ${avatar.country}` : ''}</span>
                {avatar.rating > 0 && <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400" /> {avatar.rating.toFixed(1)} ({avatar.review_count} reviews)</span>}
                {avatar.response_time_minutes && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Responds in ~{avatar.response_time_minutes}min</span>}
                <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {(avatar.languages || ['English']).join(', ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8 mt-4">
          <Link to={`/CreateBooking?avatar=${id}`} className="flex-1">
            <Button className="w-full bg-primary hover:bg-primary/90 glow-primary-sm py-5">
              <Calendar className="w-4 h-4 mr-2" /> Book Now — ${avatar.hourly_rate || 30}/hr
            </Button>
          </Link>
          <Button variant="outline" className="border-white/10 py-5 gap-2" onClick={startMessage} disabled={messaging}>
            {messaging ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            Message
          </Button>
          <Button
            variant="outline"
            className="border-white/10 py-5"
            onClick={() => toggleFavorite.mutate()}
            disabled={toggleFavorite.isPending || !user}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-primary text-primary' : ''}`} />
          </Button>
          </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Bio */}
            <GlassCard className="p-6">
              <h2 className="font-semibold mb-3">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {avatar.bio || 'This avatar is available for bookings. Contact them to learn more about their services.'}
              </p>
            </GlassCard>

            {/* Categories */}
            <GlassCard className="p-6">
              <h2 className="font-semibold mb-3">Services</h2>
              <div className="flex flex-wrap gap-2">
                {(avatar.categories || []).map(c => (
                  <Badge key={c} variant="secondary" className="bg-muted/50">{c}</Badge>
                ))}
              </div>
            </GlassCard>

            {/* Reviews */}
            <GlassCard className="p-6">
              <h2 className="font-semibold mb-4">Reviews ({reviews.length})</h2>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="border-b border-white/5 pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{r.reviewer_name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No reviews yet</p>
              )}
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <GlassCard className="p-5">
              <h3 className="text-sm font-semibold mb-3">Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Completed Jobs</span><span className="font-medium">{avatar.completed_jobs || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Hourly Rate</span><span className="font-medium text-primary">${avatar.hourly_rate || 30}</span></div>
                {avatar.per_session_rate && <div className="flex justify-between"><span className="text-muted-foreground">Per Session</span><span className="font-medium">${avatar.per_session_rate}</span></div>}
              </div>
            </GlassCard>

            {equipment.length > 0 && (
              <GlassCard className="p-5">
                <h3 className="text-sm font-semibold mb-3">Equipment</h3>
                <div className="space-y-2">
                  {equipment.map(eq => (
                    <div key={eq.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <eq.icon className="w-4 h-4 text-green-400" />
                      {eq.label}
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {(avatar.skills || []).length > 0 && (
              <GlassCard className="p-5">
                <h3 className="text-sm font-semibold mb-3">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {avatar.skills.map(s => (
                    <Badge key={s} variant="outline" className="text-xs border-white/10">{s}</Badge>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}