import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Home, Inbox, Calendar, Radio, MessageSquare, DollarSign,
  Star, User, Settings, Save, Camera
} from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', path: '/AvatarDashboard' },
  { icon: Inbox, label: 'Requests', path: '/AvatarRequests' },
  { icon: Calendar, label: 'Schedule', path: '/AvatarSchedule' },
  { icon: Radio, label: 'Live', path: '/AvatarLive' },
  { icon: MessageSquare, label: 'Messages', path: '/Messages' },
  { icon: DollarSign, label: 'Earnings', path: '/AvatarEarnings' },
  { icon: Star, label: 'Reviews', path: '/AvatarReviews' },
  { icon: User, label: 'Profile', path: '/AvatarProfileEdit' },
  { icon: Settings, label: 'Settings', path: '/AvatarSettings' },
];

export default function AvatarProfileEdit() {
  const { user, loading } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
    languages: '', skills: '', categories: '',
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
      });
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: (data) => base44.entities.AvatarProfile.update(profile.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatar-profile-edit'] });
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <AppShell navItems={navItems} user={user}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">Edit Profile</h1>
          <p className="text-muted-foreground text-sm">Update your public avatar profile</p>
        </div>
        <Button onClick={handleSave} disabled={updateProfile.isPending || !profile} className="gap-2">
          <Save className="w-4 h-4" /> {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      {!profile ? (
        <GlassCard className="p-10 text-center">
          <p className="text-muted-foreground text-sm">No avatar profile found. Complete onboarding first.</p>
        </GlassCard>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {/* Photo */}
          <GlassCard className="p-5">
            <h2 className="font-semibold text-sm mb-4">Profile Photo</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                {profile.display_name?.[0] || user?.full_name?.[0]}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Photo upload coming soon</p>
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
        </div>
      )}
    </AppShell>
  );
}