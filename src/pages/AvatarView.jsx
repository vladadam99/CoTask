import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, MapPin, Star, Shield, Clock, Globe, Radio, Smartphone,
  Wifi, Headphones, Car, Calendar, MessageSquare, Heart, Loader2
} from 'lucide-react';

function PostItem({ post }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  return (
    <div className="aspect-square rounded-xl overflow-hidden bg-white/5 relative cursor-pointer" onClick={post.type === 'video' ? togglePlay : undefined}>
      {post.type === 'video' ? (
        <>
          <video ref={videoRef} src={post.media_url} className="w-full h-full object-cover" playsInline loop />
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${playing ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
            <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
              <span className="text-white text-xs">{playing ? '⏸' : '▶'}</span>
            </div>
          </div>
        </>
      ) : (
        <img src={post.media_url} alt={post.caption} className="w-full h-full object-cover" />
      )}
    </div>
  );
}

export default function AvatarView() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const [messaging, setMessaging] = useState(false);
  const [activeTab, setActiveTab] = useState('About');

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
      const me = await base44.auth.me();
      const senderName = me.full_name || me.email;

      const existing = await base44.entities.Conversation.filter({ booking_id: `direct_${me.email}_${avatar.user_email}` });
      if (existing.length > 0) {
        navigate(`/Messages?conversation=${existing[0].id}`);
        return;
      }

      const convo = await base44.entities.Conversation.create({
        participant_emails: [me.email, avatar.user_email],
        participant_names: [senderName, avatar.display_name],
        booking_id: `direct_${me.email}_${avatar.user_email}`,
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

  const { data: posts = [] } = useQuery({
    queryKey: ['avatar-view-posts', avatar?.user_email],
    queryFn: () => base44.entities.Post.filter({ avatar_email: avatar.user_email, is_published: true }, '-created_date', 30),
    enabled: !!avatar,
  });

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!avatar) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassCard className="p-8 text-center max-w-md">
        <p className="text-muted-foreground mb-4">Avatar not found</p>
        <Link to="/Explore"><Button variant="outline">Back to Explore</Button></Link>
      </GlassCard>
    </div>
  );

  const equipment = [
    { key: 'has_smartphone', icon: Smartphone, label: 'Smartphone' },
    { key: 'has_data_connection', icon: Wifi, label: 'Data Connection' },
    { key: 'has_headset', icon: Headphones, label: 'Headset/Glasses' },
    { key: 'has_360_camera', icon: Radio, label: '360° Camera' },
    { key: 'has_vehicle', icon: Car, label: 'Vehicle' },
  ].filter(e => avatar[e.key]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">

        {/* Cover Photo */}
        <div className="relative w-full h-48 md:h-64 rounded-b-2xl overflow-hidden">
          {avatar.cover_url ? (
            <img src={avatar.cover_url} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-card" />
          )}
          <div className="absolute top-4 left-4">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white bg-black/30 backdrop-blur px-3 py-1.5 rounded-full">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="relative -mt-16 px-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            {/* Profile Picture */}
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-card border-4 border-card shadow-2xl flex-shrink-0 overflow-hidden">
              {avatar.photo_url ? (
                <img src={avatar.photo_url} alt={avatar.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-4xl font-black text-primary">
                  {avatar.display_name?.[0] || 'A'}
                </div>
              )}
            </div>

            {/* Name & Badges */}
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold">{avatar.display_name}</h1>
                {avatar.is_verified && (
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    <Shield className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                )}
                {avatar.is_available && (
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Available</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {avatar.city || 'Remote'}{avatar.country ? `, ${avatar.country}` : ''}</span>
                {avatar.rating > 0 && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400" /> {avatar.rating.toFixed(1)} ({avatar.review_count})</span>}
                <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {(avatar.languages || ['English']).join(', ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 mb-6">
          <div className="bg-card/50 rounded-xl p-4 text-center border border-white/5">
            <p className="text-2xl font-bold text-primary">${avatar.hourly_rate || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Per Hour</p>
          </div>
          <div className="bg-card/50 rounded-xl p-4 text-center border border-white/5">
            <p className="text-2xl font-bold text-primary">${avatar.per_session_rate || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Per Session</p>
          </div>

          <div className="bg-card/50 rounded-xl p-4 text-center border border-white/5">
            <p className="text-2xl font-bold text-primary">{avatar.rating > 0 ? avatar.rating.toFixed(1) : '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">Rating</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6 px-4">
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

        {/* Tab Navigation */}
        <div className="flex gap-2 px-4 mb-4 overflow-x-auto pb-1">
          {['About', 'Posts', 'Reviews', 'Services'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card/50 text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground'
              }`}
            >
              {tab}{tab === 'Posts' ? ` (${posts.length})` : tab === 'Reviews' ? ` (${reviews.length})` : ''}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="px-4 pb-8">
          {activeTab === 'About' && (
            <GlassCard className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {avatar.bio || 'This avatar is available for bookings. Contact them to learn more about their services.'}
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">

                <div className="bg-card/50 rounded-xl p-3 border border-white/5">
                  <p className="text-xs text-muted-foreground">Hourly Rate</p>
                  <p className="text-lg font-bold text-primary">${avatar.hourly_rate || 0}</p>
                </div>
              </div>
              {equipment.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Equipment</p>
                  <div className="flex flex-wrap gap-3">
                    {equipment.map(eq => (
                      <div key={eq.key} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <eq.icon className="w-4 h-4 text-green-400" />
                        {eq.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(avatar.skills || []).length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {avatar.skills.map(s => (
                      <Badge key={s} variant="outline" className="text-xs border-white/10">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          )}

          {activeTab === 'Posts' && (
            <GlassCard className="p-6">
              {posts.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {posts.map(post => <PostItem key={post.id} post={post} />)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No posts yet</p>
              )}
            </GlassCard>
          )}

          {activeTab === 'Reviews' && (
            <GlassCard className="p-6">
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
                <p className="text-sm text-muted-foreground text-center py-8">No reviews yet</p>
              )}
            </GlassCard>
          )}

          {activeTab === 'Services' && (
            <GlassCard className="p-6">
              {(avatar.categories || []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {avatar.categories.map(c => (
                    <Badge key={c} variant="secondary" className="bg-muted/50 text-sm py-1.5 px-3">{c}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No services listed</p>
              )}
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}