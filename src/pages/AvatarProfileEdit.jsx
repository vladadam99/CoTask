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
  Star, User, Settings, Save, Camera, Upload, Loader2, Plus, Grid, Eye
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

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">Edit Profile</h1>
          <p className="text-muted-foreground text-sm">Update your public avatar profile</p>
        </div>
        <div className="flex gap-2">
          {profile && (
            <Button variant="outline" className="gap-2 border-white/10" onClick={() => navigate(`/AvatarView?id=${profile.id}`)}>            
              <Eye className="w-4 h-4" /> View Profile
            </Button>
          )}
          <Button onClick={handleSave} disabled={updateProfile.isPending || !profile} className="gap-2">
            <Save className="w-4 h-4" /> {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {!profile ? (
        <GlassCard className="p-10 text-center">
          <p className="text-muted-foreground text-sm">No avatar profile found. Complete onboarding first.</p>
        </GlassCard>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {/* Photo & Cover */}
          <GlassCard className="p-5">
            <h2 className="font-semibold text-sm mb-4">Profile Photo & Cover</h2>
            {/* Cover */}
            <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-card mb-6 group cursor-pointer border-2 border-dashed border-white/10 hover:border-primary/40 transition-all" onClick={() => coverInputRef.current?.click()}>
              {form.cover_url ? (
                <>
                  <img src={form.cover_url} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                    {uploadingCover ? (
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1.5 rounded-full">
                        <Upload className="w-4 h-4 text-white" />
                        <span className="text-white text-xs font-semibold">Change Cover</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Add Cover Photo</p>
                    <p className="text-xs text-muted-foreground">Click to upload</p>
                  </div>
                </div>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} />
            </div>
            {/* Profile photo */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary overflow-hidden group">
                {form.photo_url ? (
                  <img src={form.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile.display_name?.[0] || user?.full_name?.[0]
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Upload className="w-4 h-4 text-white" />}
                </button>
              </div>
              <div>
                <p className="text-sm font-medium">Profile Photo</p>
                <p className="text-xs text-muted-foreground">Hover to upload</p>
              </div>
            </div>
          </GlassCard>

          {/* Basic Info */}
          <GlassCard className="p-5 space-y-4">
            <h2 className="font-semibold text-sm">Basic Information</h2>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
              <Input value={form.display_name} onChange={set('display_name')} className="bg-muted/30 border-white/5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
              <Textarea value={form.bio} onChange={set('bio')} rows={3} className="bg-muted/30 border-white/5 resize-none" placeholder="Tell clients about yourself..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">City</label>
                <Input value={form.city} onChange={set('city')} className="bg-muted/30 border-white/5" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Country</label>
                <Input value={form.country} onChange={set('country')} className="bg-muted/30 border-white/5" />
              </div>
            </div>
          </GlassCard>

          {/* Rates */}
          <GlassCard className="p-5 space-y-4">
            <h2 className="font-semibold text-sm">Rates</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Hourly Rate ($)</label>
                <Input type="number" value={form.hourly_rate} onChange={set('hourly_rate')} className="bg-muted/30 border-white/5" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Per Session Rate ($)</label>
                <Input type="number" value={form.per_session_rate} onChange={set('per_session_rate')} className="bg-muted/30 border-white/5" />
              </div>
            </div>
          </GlassCard>

          {/* Skills & Categories */}
          <GlassCard className="p-5 space-y-4">
            <h2 className="font-semibold text-sm">Skills & Categories</h2>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Categories (comma-separated)</label>
              <Input value={form.categories} onChange={set('categories')} className="bg-muted/30 border-white/5" placeholder="e.g. Tourism, Real Estate, Events" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Skills (comma-separated)</label>
              <Input value={form.skills} onChange={set('skills')} className="bg-muted/30 border-white/5" placeholder="e.g. Photography, Navigation, Hosting" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Languages (comma-separated)</label>
              <Input value={form.languages} onChange={set('languages')} className="bg-muted/30 border-white/5" placeholder="e.g. English, Spanish, French" />
            </div>
          </GlassCard>

          {/* My Posts */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-sm">My Posts</h2>
                <span className="text-xs text-muted-foreground">({myPosts.length})</span>
              </div>
              <Button size="sm" onClick={() => setShowUpload(true)} className="gap-1.5 h-8">
                <Plus className="w-3.5 h-3.5" /> New Post
              </Button>
            </div>
            {myPosts.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-3xl">📸</p>
                <p className="text-sm text-muted-foreground">No posts yet. Share your work!</p>
                <Button size="sm" variant="outline" className="border-white/10" onClick={() => setShowUpload(true)}>Upload first post</Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {myPosts.map(post => (
                  <div key={post.id} className="aspect-square rounded-xl overflow-hidden bg-white/5 relative">
                    {post.type === 'video'
                      ? <video src={post.media_url} className="w-full h-full object-cover" muted />
                      : <img src={post.media_url} alt={post.caption} className="w-full h-full object-cover" />}
                    {post.type === 'video' && (
                      <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full">▶</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      <AnimatePresence>
        {showUpload && <PostUpload user={user} profile={profile} onClose={() => setShowUpload(false)} />}
      </AnimatePresence>
    </AppShell>
  );
}