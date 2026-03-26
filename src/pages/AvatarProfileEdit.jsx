import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import PostCard from '@/components/explore/PostCard';
import PostUpload from '@/components/explore/PostUpload';
import { AnimatePresence } from 'framer-motion';
import { getNavItems } from '@/lib/navItems';
import { useNavigate } from 'react-router-dom';
import {
  Home, Inbox, Calendar, Radio, MessageSquare, DollarSign,
  Star, User, Settings, Save, Camera, Upload, Loader2, Plus, Grid, Eye, MapPin
} from 'lucide-react';



export default function AvatarProfileEdit() {
  const { user, loading } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['avatar-profile-edit', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.AvatarProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState({
    display_name: '', bio: '', city: '', country: '',
    hourly_rate: '', per_session_rate: '', currency: 'USD',
    languages: '', skills: '', categories: '', photo_url: '', cover_url: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        city: profile.city || '',
        country: profile.country || '',
        hourly_rate: profile.hourly_rate || '',
        per_session_rate: profile.per_session_rate || '',
        currency: profile.currency || 'USD',
        languages: (profile.languages || []).join(', '),
        skills: (profile.skills || []).join(', '),
        categories: (profile.categories || []).join(', '),
        photo_url: profile.photo_url || '',
        cover_url: profile.cover_url || '',
      });
    }
  }, [profile]);

  const handleCoverUpload = async (file) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, cover_url: file_url }));
      await base44.entities.AvatarProfile.update(profile.id, { cover_url: file_url });
      queryClient.invalidateQueries({ queryKey: ['avatar-profile-edit'] });
      queryClient.invalidateQueries({ queryKey: ['explore-avatars'] });
      toast({ title: 'Cover updated', description: 'Your cover photo has been saved.' });
    } catch (error) {
      toast({ title: 'Upload failed', description: 'Could not upload cover photo' });
    }
    setUploadingCover(false);
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, photo_url: file_url }));
      // Update profile
      await base44.entities.AvatarProfile.update(profile.id, { photo_url: file_url });
      // Sync photo to all existing posts
      const posts = await base44.entities.Post.filter({ avatar_email: user.email });
      await Promise.all(posts.map(p => base44.entities.Post.update(p.id, { avatar_photo_url: file_url })));
      queryClient.invalidateQueries({ queryKey: ['avatar-profile-edit'] });
      queryClient.invalidateQueries({ queryKey: ['explore-avatars'] });
      queryClient.invalidateQueries({ queryKey: ['avatar-posts'] });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
      toast({ title: 'Photo updated', description: 'Your profile photo has been updated everywhere.' });
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast({ title: 'Upload failed', description: 'Could not upload photo' });
    }
    setUploading(false);
  };

  const updateProfile = useMutation({
    mutationFn: (data) => base44.entities.AvatarProfile.update(profile.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatar-profile-edit'] });
      queryClient.invalidateQueries({ queryKey: ['explore-avatars'] });
      queryClient.invalidateQueries({ queryKey: ['avatar-posts'] });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
    },
  });

  const handleSave = () => {
    updateProfile.mutate({
      ...form,
      hourly_rate: parseFloat(form.hourly_rate) || 0,
      per_session_rate: parseFloat(form.per_session_rate) || 0,
      languages: form.languages.split(',').map(s => s.trim()).filter(Boolean),
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      categories: form.categories.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const { data: myPosts = [] } = useQuery({
    queryKey: ['avatar-posts', user?.email],
    queryFn: () => base44.entities.Post.filter({ avatar_email: user.email }, '-created_date', 30),
    enabled: !!user,
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  if (!profile) {
    return (
      <AppShell navItems={getNavItems(user?.role)} user={user}>
        <GlassCard className="p-10 text-center max-w-md mx-auto mt-20">
          <p className="text-muted-foreground text-sm">No avatar profile found. Complete onboarding first.</p>
        </GlassCard>
      </AppShell>
    );
  }

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="max-w-4xl mx-auto">
        {/* Cover Photo */}
        <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-20 group cursor-pointer" onClick={() => coverInputRef.current?.click()}>
          {form.cover_url ? (
            <>
              <img src={form.cover_url} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                {uploadingCover ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                    <Camera className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-semibold">Change Cover</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-card flex flex-col items-center justify-center gap-3" onClick={() => coverInputRef.current?.click()}>
              <div className="w-14 h-14 rounded-full bg-primary/30 flex items-center justify-center">
                <Camera className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Add Cover Photo</p>
            </div>
          )}
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} />
        </div>

        {/* Profile Header Section */}
        <div className="relative -mt-24 px-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            {/* Profile Picture */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-card border-4 border-card shadow-2xl flex-shrink-0 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {form.photo_url ? (
                <img src={form.photo_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-4xl md:text-5xl font-black text-primary">
                  {profile.display_name?.[0] || user?.full_name?.[0]}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Camera className="w-6 h-6 text-white" />}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
            </div>

            {/* Name & Actions */}
            <div className="flex-1 pt-2 md:pb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{form.display_name || 'Your Profile'}</h1>
                  <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {form.city || 'City'}, {form.country || 'Country'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2 border-white/10" onClick={() => navigate(`/AvatarView?id=${profile.id}`)}>
                    <Eye className="w-4 h-4" /> View
                  </Button>
                  <Button onClick={handleSave} disabled={updateProfile.isPending} className="gap-2">
                    <Save className="w-4 h-4" /> {updateProfile.isPending ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="px-4 mb-6">
          <Textarea 
            value={form.bio} 
            onChange={set('bio')} 
            rows={2}
            className="bg-transparent border-none text-base resize-none focus-visible:ring-0 p-0"
            placeholder="Write a bio..."
          />
        </div>

        {/* Stats & Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 mb-6">
          <div className="bg-card/50 rounded-xl p-4 text-center border border-white/5">
            <p className="text-2xl font-bold text-primary">${form.hourly_rate || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Per Hour</p>
          </div>
          <div className="bg-card/50 rounded-xl p-4 text-center border border-white/5">
            <p className="text-2xl font-bold text-primary">${form.per_session_rate || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Per Session</p>
          </div>
          <div className="bg-card/50 rounded-xl p-4 text-center border border-white/5">
            <p className="text-2xl font-bold text-primary">{(form.categories || '').split(',').filter(Boolean).length}</p>
            <p className="text-xs text-muted-foreground mt-1">Categories</p>
          </div>
          <div className="bg-card/50 rounded-xl p-4 text-center border border-white/5">
            <p className="text-2xl font-bold text-primary">{(form.skills || '').split(',').filter(Boolean).length}</p>
            <p className="text-xs text-muted-foreground mt-1">Skills</p>
          </div>
        </div>

        {/* Editable Sections */}
        <div className="px-4 space-y-6 mb-6">
          {/* Categories */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Grid className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Categories</h3>
            </div>
            <Input 
              value={form.categories} 
              onChange={set('categories')} 
              className="bg-transparent border-white/10"
              placeholder="e.g. Tourism, Real Estate, Events"
            />
          </GlassCard>

          {/* Skills */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Skills</h3>
            </div>
            <Input 
              value={form.skills} 
              onChange={set('skills')} 
              className="bg-transparent border-white/10"
              placeholder="e.g. Photography, Navigation, Hosting"
            />
          </GlassCard>

          {/* Languages */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Languages</h3>
            </div>
            <Input 
              value={form.languages} 
              onChange={set('languages')} 
              className="bg-transparent border-white/10"
              placeholder="e.g. English, Spanish, French"
            />
          </GlassCard>

          {/* Location */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Location</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input 
                value={form.city} 
                onChange={set('city')} 
                className="bg-transparent border-white/10"
                placeholder="City"
              />
              <Input 
                value={form.country} 
                onChange={set('country')} 
                className="bg-transparent border-white/10"
                placeholder="Country"
              />
            </div>
          </GlassCard>

          {/* Rates */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Rates</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Hourly Rate ($)</label>
                <Input 
                  type="number" 
                  value={form.hourly_rate} 
                  onChange={set('hourly_rate')} 
                  className="bg-transparent border-white/10"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Per Session ($)</label>
                <Input 
                  type="number" 
                  value={form.per_session_rate} 
                  onChange={set('per_session_rate')} 
                  className="bg-transparent border-white/10"
                />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Posts Grid */}
        <div className="px-4 pb-8">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">My Posts</h3>
                <span className="text-xs text-muted-foreground">({myPosts.length})</span>
              </div>
              <Button size="sm" onClick={() => setShowUpload(true)} className="gap-1.5 h-8">
                <Plus className="w-3.5 h-3.5" /> New Post
              </Button>
            </div>
            {myPosts.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">No posts yet. Share your work!</p>
                <Button size="sm" variant="outline" className="border-white/10" onClick={() => setShowUpload(true)}>Upload first post</Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {myPosts.map(post => (
                  <div key={post.id} className="aspect-square rounded-xl overflow-hidden bg-white/5 relative group">
                    {post.type === 'video'
                      ? <video src={post.media_url} className="w-full h-full object-cover" muted />
                      : <img src={post.media_url} alt={post.caption} className="w-full h-full object-cover" />}
                    {post.type === 'video' && (
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full">▶</div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="sm" variant="outline" className="border-white/20 text-white">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      <AnimatePresence>
        {showUpload && <PostUpload user={user} profile={profile} onClose={() => setShowUpload(false)} />}
      </AnimatePresence>
    </AppShell>
  );
}