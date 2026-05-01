import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Mail, MapPin, Globe, Upload, Loader2, ArrowLeft, FileText, Pencil, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Profile() {
  const { user, updateUser } = useCurrentUser();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(() => user?.profile_picture_url || '');
  const [coverUrl, setCoverUrl] = useState(() => user?.cover_picture_url || '');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [avatarProfile, setAvatarProfile] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const fileInputRef = useRef(null);
  const cvInputRef = useRef(null);
  const coverInputRef = useRef(null);

  React.useEffect(() => {
    if (user?.profile_picture_url) setProfilePicUrl(user.profile_picture_url);
    if (user?.cover_picture_url) setCoverUrl(user.cover_picture_url);
  }, [user?.profile_picture_url, user?.cover_picture_url]);

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    setSavingName(true);
    await updateUser({ display_name: nameValue.trim() });
    setSavingName(false);
    setEditingName(false);
  };

  React.useEffect(() => {
    if (user?.email && user?.selected_role === 'avatar') {
      base44.entities.AvatarProfile.filter({ user_email: user.email }).then(r => setAvatarProfile(r[0] || null));
    }
  }, [user?.email, user?.selected_role]);

  const { data: avatarPosts = [] } = useQuery({
    queryKey: ['my-posts', user?.email],
    queryFn: () => base44.entities.Post.filter({ avatar_email: user.email }, '-created_date', 50),
    enabled: !!user?.email && user?.selected_role === 'avatar',
  });

  const handleCvUpload = async (file) => {
    if (!file || !avatarProfile) return;
    setUploadingCv(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.AvatarProfile.update(avatarProfile.id, { cv_url: file_url, cv_filename: file.name });
      setAvatarProfile(p => ({ ...p, cv_url: file_url, cv_filename: file.name }));
    } catch (e) {
      console.error(e);
    }
    setUploadingCv(false);
  };

  const handleRemoveCv = async () => {
    if (!avatarProfile) return;
    await base44.entities.AvatarProfile.update(avatarProfile.id, { cv_url: '', cv_filename: '' });
    setAvatarProfile(p => ({ ...p, cv_url: '', cv_filename: '' }));
  };

  const dashPath = user?.selected_role === 'avatar' ? '/AvatarDashboard' : user?.selected_role === 'enterprise' ? '/EnterpriseDashboard' : '/UserDashboard';

  const handleCoverUpload = async (file) => {
    if (!file) return;
    setUploadingCover(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await updateUser({ cover_picture_url: file_url });
    setCoverUrl(file_url);
    // Sync to AvatarProfile if avatar role
    if (avatarProfile?.id) {
      await base44.entities.AvatarProfile.update(avatarProfile.id, { cover_url: file_url });
    }
    setUploadingCover(false);
  };

  const handleProfilePictureUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ profile_picture_url: file_url });
    setProfilePicUrl(file_url);
    // Sync to AvatarProfile so it shows on FindAvatars / AvatarView
    if (avatarProfile?.id) {
      await base44.entities.AvatarProfile.update(avatarProfile.id, { photo_url: file_url });
      setAvatarProfile(p => ({ ...p, photo_url: file_url }));
    }
    setUploading(false);
  };

  const isAvatar = user?.selected_role === 'avatar';

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Link to={dashPath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        {/* Cover + Profile Picture */}
        <div className="relative mb-16">
          {/* Banner */}
          <div className="relative w-full h-36 rounded-2xl bg-muted overflow-hidden group">
            {coverUrl
              ? <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">No cover photo</span>
                </div>
            }
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} />
            <button onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium">
              {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" /> Change Cover</>}
            </button>
          </div>

          {/* Profile Picture overlapping the banner */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <div className="relative w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary overflow-hidden group ring-4 ring-background">
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
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">{user?.display_name || user?.full_name || 'User'}</h1>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
          <Badge className="mt-2 bg-primary/10 text-primary border-primary/20 capitalize">{user?.selected_role || user?.role || 'user'}</Badge>
        </div>

        {/* Tabs for avatar */}
        {isAvatar && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {['about', 'services', 'posts', 'cv'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all border ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card/50 text-muted-foreground border-white/10 hover:text-foreground'
                }`}
              >
                {tab === 'posts' ? `Posts (${avatarPosts.length})` : tab === 'cv' ? 'CV' : tab === 'services' ? 'Services & Pricing' : 'Profile Details'}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {(!isAvatar || activeTab === 'about') && <GlassCard className="p-5">
            <h3 className="font-semibold mb-4">Profile Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground shrink-0">Name</span>
                {editingName ? (
                  <div className="ml-auto flex items-center gap-2">
                    <input
                      autoFocus
                      className="border border-input rounded-md px-2 py-1 text-sm bg-background w-36"
                      value={nameValue}
                      onChange={e => setNameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                    />
                    <button onMouseDown={e => { e.preventDefault(); handleSaveName(); }} disabled={savingName} className="text-primary hover:opacity-70">
                      {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button onMouseDown={e => { e.preventDefault(); setEditingName(false); }} className="text-muted-foreground hover:opacity-70">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="font-medium">{user?.display_name || user?.full_name || 'Not set'}</span>
                    <button onClick={() => { setNameValue(user?.display_name || user?.full_name || ''); setEditingName(true); }} className="text-muted-foreground hover:text-primary">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
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
          </GlassCard>}

          {(!isAvatar || activeTab === 'services') && user?.selected_role === 'avatar' && avatarProfile && (
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Services & Pricing</h3>
                <a href="/AvatarProfileEdit" className="text-xs text-primary hover:underline">Edit →</a>
              </div>
              <div className="space-y-3 text-sm">
                {avatarProfile.categories?.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1.5">Services</p>
                    <div className="flex flex-wrap gap-1.5">
                      {avatarProfile.categories.map(cat => (
                        <span key={cat} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{cat}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(avatarProfile.hourly_rate > 0 || avatarProfile.per_session_rate > 0) && (
                  <div className="flex gap-4 pt-1">
                    {avatarProfile.hourly_rate > 0 && (
                      <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-primary">${avatarProfile.hourly_rate}</p>
                        <p className="text-xs text-muted-foreground">Per Hour</p>
                      </div>
                    )}
                    {avatarProfile.per_session_rate > 0 && (
                      <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-primary">${avatarProfile.per_session_rate}</p>
                        <p className="text-xs text-muted-foreground">Per Session</p>
                      </div>
                    )}
                  </div>
                )}
                {(!avatarProfile.categories?.length && !avatarProfile.hourly_rate && !avatarProfile.per_session_rate) && (
                  <p className="text-muted-foreground text-xs">No services or pricing set yet. <a href="/AvatarProfileEdit" className="text-primary hover:underline">Add them →</a></p>
                )}
              </div>
            </GlassCard>
          )}

          {isAvatar && activeTab === 'posts' && (
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">My Posts</h3>
                <Link to="/AvatarProfileEdit" className="text-xs text-primary hover:underline">Manage →</Link>
              </div>
              {avatarPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No posts yet. Create some from your profile editor.</p>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {avatarPosts.map(post => (
                    <div key={post.id} className="aspect-square rounded-lg overflow-hidden bg-muted relative">
                      {post.type === 'video' ? (
                        <video src={post.media_url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={post.media_url} alt={post.caption} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute bottom-1 right-1 flex gap-1.5 text-white text-[10px]">
                        <span>♡ {post.likes_count || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          )}

          {(!isAvatar || activeTab === 'cv') && user?.selected_role === 'avatar' && (
            <GlassCard className="p-4">
              <h3 className="font-semibold mb-3">CV / Resume</h3>
              <input ref={cvInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCvUpload(f); }} />
              {avatarProfile?.cv_url ? (
                <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <FileText className="w-5 h-5 text-green-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-400 truncate">{avatarProfile.cv_filename || 'CV uploaded'}</p>
                    <a href={avatarProfile.cv_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary">View CV →</a>
                  </div>
                  <div className="flex gap-3 shrink-0 text-xs">
                    <button onClick={() => cvInputRef.current?.click()} disabled={uploadingCv} className="text-primary hover:underline">
                      {uploadingCv ? 'Uploading...' : 'Replace'}
                    </button>
                    <button onClick={handleRemoveCv} className="text-red-400 hover:underline">Remove</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => cvInputRef.current?.click()} disabled={uploadingCv}
                  className="w-full h-14 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-all disabled:opacity-50">
                  {uploadingCv
                    ? <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Uploading...</span></>
                    : <><FileText className="w-4 h-4" /><span className="text-sm">Upload your CV (PDF, DOC, DOCX)</span></>}
                </button>
              )}
            </GlassCard>
          )}

        </div>
      </div>
    </div>
  );
}