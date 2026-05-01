import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Copy, ArrowLeft, LogIn } from 'lucide-react';
import SmartImage from '@/components/media/SmartImage';
import { motion } from 'framer-motion';

export default function PublicPostView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postId = searchParams.get('id');
  const [post, setPost] = useState(null);
  const [avatarProfile, setAvatarProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!postId) return;
    const load = async () => {
      try {
        const posts = await base44.entities.Post.filter({ id: postId });
        if (posts.length > 0) {
          const p = posts[0];
          setPost(p);
          // Fetch avatar profile
          if (p.avatar_email) {
            const profiles = await base44.entities.AvatarProfile.filter({ user_email: p.avatar_email });
            if (profiles.length > 0) setAvatarProfile(profiles[0]);
          }
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  const mediaList = (post.media_urls && post.media_urls.length > 0)
    ? post.media_urls.map((url, i) => ({ url, type: post.media_types?.[i] || 'photo' }))
    : [{ url: post.media_url, type: post.type || 'photo' }];
  const currentMedia = mediaList[mediaIndex];
  const isMulti = mediaList.length > 1;
  const postUrl = `${window.location.origin}/PublicPostView?id=${post.id}`;

  const handleShare = (type) => {
    if (type === 'copy') {
      navigator.clipboard.writeText(postUrl);
      alert('Link copied to clipboard!');
    }
    setShowShareMenu(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-lg font-bold">Post</h1>
          <div className="w-12" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Media Section */}
        <div className="relative w-full aspect-square bg-background rounded-2xl overflow-hidden border border-border mb-6">
          {currentMedia.type === 'video' ? (
            <video src={currentMedia.url} className="w-full h-full object-contain" controls playsInline />
          ) : (
            <SmartImage src={currentMedia.url} alt={post.caption} className="w-full h-full object-contain" />
          )}

          {/* Media navigation */}
          {isMulti && (
            <div className="absolute top-4 left-4 right-4 flex justify-center gap-1.5 z-10">
              {mediaList.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setMediaIndex(i)}
                  className={`rounded-full transition-all ${
                    i === mediaIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {isMulti && (
            <>
              <button
                onClick={() => mediaIndex > 0 && setMediaIndex(mediaIndex - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                ←
              </button>
              <button
                onClick={() => mediaIndex < mediaList.length - 1 && setMediaIndex(mediaIndex + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                →
              </button>
            </>
          )}
        </div>

        {/* Avatar Section */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl border border-border bg-card">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-base font-bold text-primary overflow-hidden">
            {post.avatar_photo_url ? (
              <SmartImage src={post.avatar_photo_url} alt={post.avatar_name} className="w-full h-full object-cover" />
            ) : (
              post.avatar_name?.[0] || 'A'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate">{post.avatar_name || 'Avatar'}</h2>
            {post.category && <p className="text-xs text-muted-foreground">{post.category}</p>}
          </div>
          <Button
            onClick={() => {
              if (avatarProfile?.id) {
                window.location.href = `/AvatarView?id=${avatarProfile.id}`;
              }
            }}
            variant="outline"
            size="sm"
          >
            View Profile
          </Button>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="mb-6 p-4 rounded-xl border border-border bg-card">
            <p className="text-foreground leading-relaxed">
              <span className="font-semibold mr-2">{post.avatar_name}</span>
              {post.caption}
            </p>
          </div>
        )}

        {/* Engagement */}
        <div className="flex items-center gap-6 mb-8 p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 text-sm">
            <Heart className="w-5 h-5 text-muted-foreground" />
            <span>{post.likes_count || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
            <span>{post.comments_count || 0}</span>
          </div>
          <div className="relative ml-auto">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <Share2 className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Share</span>
            </motion.button>

            {showShareMenu && (
              <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-30 min-w-[140px] overflow-hidden">
                <button
                  onClick={() => handleShare('copy')}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-primary/10 transition-colors border-b border-border"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Auth Prompts */}
        <div className="space-y-4">
          <div className="p-6 rounded-xl border border-primary/20 bg-primary/5">
            <h3 className="font-semibold mb-3">Like and comment on this post</h3>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/Landing')}
                variant="outline"
                className="flex-1"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate('/Register')}
                className="flex-1"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}