import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, MapPin, Globe, Settings, LogOut, ArrowLeft, Upload, Loader2, ArrowRightLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Profile() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(user?.profile_picture_url || '');
  const fileInputRef = useRef(null);

  const dashPath = user?.app_role === 'avatar' ? '/AvatarDashboard' : user?.app_role === 'enterprise' ? '/EnterpriseDashboard' : '/UserDashboard';

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
    if (targetRole === user?.app_role) return;

    // Check if user has an account with this role
    if (targetRole === 'avatar') {
      const avatarProfile = await base44.entities.AvatarProfile.filter({ user_email: user.email }, '', 1);
      if (avatarProfile.length > 0) {
        await base44.auth.updateMe({ app_role: 'avatar' });
        navigate('/AvatarDashboard');
      } else {
        await base44.auth.updateMe({ app_role: 'avatar' });
        navigate('/Onboarding');
      }
    } else if (targetRole === 'enterprise') {
      const enterpriseProfile = await base44.entities.EnterpriseProfile.filter({ user_email: user.email }, '', 1);
      if (enterpriseProfile.length > 0) {
        await base44.auth.updateMe({ app_role: 'enterprise' });
        navigate('/EnterpriseDashboard');
      } else {
        await base44.auth.updateMe({ app_role: 'enterprise' });
        navigate('/Onboarding');
      }
    } else {
      await base44.auth.updateMe({ app_role: 'user' });
      navigate('/UserDashboard');
    }
  };

  return (
    <div className="min-h-screen pb-12 px-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Link to={dashPath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary mx-auto mb-4">
            {user?.full_name?.[0] || 'U'}
          </div>
          <h1 className="text-2xl font-bold">{user?.full_name || 'User'}</h1>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
          <Badge className="mt-2 bg-primary/10 text-primary border-primary/20 capitalize">{user?.app_role || 'user'}</Badge>
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