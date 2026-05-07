import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getNavItems } from '@/lib/navItems';
import { ArrowLeft, Upload, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

export default function UserProfileEdit() {
  const { user, updateUser } = useCurrentUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || user.full_name || '');
      setCity(user.city || '');
      setBio(user.bio || '');
      setProfilePicUrl(user.profile_picture_url || '');
      setCoverUrl(user.cover_picture_url || '');
    }
  }, [user?.email]);

  const handleProfilePicUpload = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ profile_picture_url: file_url });
    setProfilePicUrl(file_url);
    setUploading(false);
  };

  const handleCoverUpload = async (file) => {
    setUploadingCover(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await updateUser({ cover_picture_url: file_url });
    setCoverUrl(file_url);
    setUploadingCover(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateUser({ display_name: displayName, city, bio });
    toast({ title: 'Profile saved!' });
    setSaving(false);
    navigate('/Profile');
  };

  return (
    <AppShell navItems={getNavItems(user?.selected_role)} user={user}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/Profile')} className="p-1.5 rounded-lg hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </div>

        {/* Cover photo */}
        <div className="relative mb-16">
          <div className="w-full h-36 rounded-2xl bg-muted overflow-hidden group cursor-pointer"
            onClick={() => coverInputRef.current?.click()}>
            {coverUrl
              ? <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Tap to add cover photo</span>
                </div>}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium rounded-2xl">
              {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Change Cover</>}
            </div>
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} />

          {/* Avatar */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <div className="relative w-24 h-24 rounded-full ring-4 ring-background bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary overflow-hidden group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}>
              {profilePicUrl
                ? <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                : (user?.full_name?.[0] || 'U')}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Upload className="w-5 h-5 text-white" />}
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleProfilePicUpload(f); }} />
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <GlassCard className="p-5 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Display Name</label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">City</label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. London" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell people a bit about yourself..."
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
          </GlassCard>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            Save Profile
          </Button>
        </div>
      </div>
    </AppShell>
  );
}