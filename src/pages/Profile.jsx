import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, MapPin, Globe, LogOut, Upload, Loader2, ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Profile() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(user?.profile_picture_url || '');
  const fileInputRef = useRef(null);

  const dashPath = user?.role === 'avatar' ? '/AvatarDashboard' : user?.role === 'enterprise' ? '/EnterpriseDashboard' : '/UserDashboard';

  const handleProfilePictureUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_picture_url: file_url });
      setProfilePicUrl(file_url);
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
    }
    setUploading(false);
  };

  const handleSwitchRole = async (targetRole) => {
    if (targetRole === user?.role) return;
    await base44.auth.updateMe({ role: targetRole });
    if (targetRole === 'avatar') {
      const profiles = await base44.entities.AvatarProfile.filter({ user_email: user.email });
      navigate(profiles.length > 0 ? '/AvatarDashboard' : '/Onboarding?role=avatar');
    } else if (targetRole === 'enterprise') {
      const profiles = await base44.entities.EnterpriseProfile.filter({ user_email: user.email });
      navigate(profiles.length > 0 ? '/EnterpriseDashboard' : '/Onboarding?role=enterprise');
    } else {
      navigate('/UserDashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Link to={dashPath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <div className="text-center mb-8">
          <div className="relative w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary mx-auto mb-4 overflow-hidden group">
            {profilePicUrl ? (
              <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.full_name?.[0] || 'U'
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleProfilePictureUpload(f); }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Upload className="w-5 h-5 text-white" />}
            </button>
          </div>
          <h1 className="text-2xl font-bold">{user?.full_name || 'User'}</h1>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
          <Badge className="mt-2 bg-primary/10 text-primary border-primary/20 capitalize">{user?.role || 'user'}</Badge>
        </div>

        <div className="space-y-3">
          <GlassCard className="p-5">
            <h3 className="font-semibold mb-4">Profile Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Name</span>
                <span className="ml-auto font-medium">{user?.full_name || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email</span>
                <span className="ml-auto font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">City</span>
                <span className="ml-auto font-medium">{user?.city || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Language</span>
                <span className="ml-auto font-medium">{user?.preferred_language || 'English'}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <h3 className="font-semibold mb-3">Switch Role</h3>
            <div className="space-y-2">
              {user?.role !== 'user' && (
                <button onClick={() => handleSwitchRole('user')} className="w-full text-left">
                  <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm flex items-center gap-3">
                    <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                    <span>Switch to User</span>
                  </div>
                </button>
              )}
              {user?.role !== 'avatar' && (
                <button onClick={() => handleSwitchRole('avatar')} className="w-full text-left">
                  <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm flex items-center gap-3">
                    <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                    <span>Switch to Avatar</span>
                  </div>
                </button>
              )}
              {user?.role !== 'enterprise' && (
                <button onClick={() => handleSwitchRole('enterprise')} className="w-full text-left">
                  <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm flex items-center gap-3">
                    <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                    <span>Switch to Enterprise</span>
                  </div>
                </button>
              )}
            </div>
          </GlassCard>

          <button onClick={() => base44.auth.logout('/Landing')} className="w-full text-left">
            <GlassCard className="p-4 flex items-center gap-3" hover>
              <LogOut className="w-5 h-5 text-red-400" />
              <span className="font-medium text-sm text-red-400">Sign out</span>
            </GlassCard>
          </button>
        </div>
      </div>
    </div>
  );
}