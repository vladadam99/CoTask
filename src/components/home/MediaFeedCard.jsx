import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SmartImage from '@/components/media/SmartImage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, MessageCircle, Share2, Play, Volume2, VolumeX, Loader2, MapPin, Star, Copy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MediaFeedCard({ item, itemType, user }) {
  // item is either a Post or Reel
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [localLikes, setLocalLikes] = useState(item.likes_count || item.likes || 0);

  const isVideo = itemType === 'reel' || item.type === 'video' || (item.media_types?.[0] === 'video');
  const mediaUrl = itemType === 'reel' ? item.video_url : item.media_url;
  const thumbUrl = item.thumbnail_url;
  const avatarName = item.avatar_name;
  const avatarPhoto = item.avatar_photo_url;
  const avatarProfileId = item.avatar_profile_id;
  const caption = itemType === 'reel' ? item.description : item.caption;
  const category = item.category;

  // Like logic (posts only for full mutation, reels are optimistic)
  const { data: liked = false } = useQuery({
    queryKey: ['post-liked', user?.email, item.id],
    queryFn: async () => {
      if (itemType !== 'post') return false;
      const likes = await base44.entities.PostLike.filter({ post_id: item.id, user_email: user.email });
      return likes.length > 0;
    },
    enabled: !!user && itemType === 'post',
  });

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (itemType === 'post') {
        if (liked) {
          const likes = await base44.entities.PostLike.filter({ post_id: item.id, user_email: user.email });
          if (likes[0]) await base44.entities.PostLike.delete(likes[0].id);
          await base44.entities.Post.update(item.id, { likes_count: Math.max(0, localLikes - 1) });
          setLocalLikes(v => Math.max(0, v - 1));
        } else {
          await base44.entities.PostLike.create({ post_id: item.id, user_email: user.email });
          await base44.entities.Post.update(item.id, { likes_count: localLikes + 1 });
          setLocalLikes(v => v + 1);
        }
      } else {
        setLocalLikes(v => v + 1);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-liked', user?.email, item.id] });
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['post-comments', item.id],
    queryFn: () => base44.entities.PostComment.filter({ post_id: item.id }, '-created_date', 20),
    enabled: showComments && itemType === 'post',
  });

  const addComment = useMutation({
    mutationFn: async () => {
      await base44.entities.PostComment.create({
        post_id: item.id,
        commenter_email: user.email,
        commenter_name: user.full_name || user.email,
        content: commentText.trim(),
      });
      await base44.entities.Post.update(item.id, { comments_count: (item.comments_count || 0) + 1 });
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['post-comments', item.id] });
    },
  });

  // Autoplay video on scroll
  useEffect(() => {
    if (!isVideo || !mediaUrl) return;
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        video.muted = true;
        setIsMuted(true);
        if (video.readyState >= 3) {
          video.play().catch(() => {});
          setPlaying(true);
        } else {
          setVideoLoading(true);
          const onReady = () => { setVideoLoading(false); video.play().catch(() => {}); setPlaying(true); };
          video.addEventListener('canplay', onReady, { once: true });
        }
      } else {
        video.pause();
        setPlaying(false);
        setVideoLoading(false);
      }
    }, { threshold: 0.5 });
    if (cardRef.current) observer.observe(cardRef.current);
    return () => { observer.disconnect(); video?.pause(); };
  }, [isVideo, mediaUrl]);

  const isSquare = !isVideo; // photos use a square/portrait format, videos use taller

  return (
    <div ref={cardRef} className="mx-4 my-1">
      <div className="rounded-3xl overflow-hidden border border-white/5 bg-card">
        {/* Author bar */}
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(`/AvatarView?id=${avatarProfileId}`)}>
            <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 border border-white/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
              {avatarPhoto
                ? <SmartImage src={avatarPhoto} alt={avatarName} className="w-full h-full" width={64} />
                : avatarName?.[0] || 'A'}
            </div>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">{avatarName}</p>
            {category && <p className="text-xs text-muted-foreground">{category}</p>}
          </div>
          {itemType === 'reel' && (
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5 font-semibold">REEL</span>
          )}
        </div>

        {/* Media */}
        <div className={`relative bg-black overflow-hidden ${isVideo ? 'aspect-[4/5]' : 'aspect-square'}`}>
          {isVideo && mediaUrl ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full h-full object-cover"
              loop playsInline muted preload="metadata"
              onClick={() => { const v = videoRef.current; if (!v) return; if (playing) { v.pause(); setPlaying(false); } else { v.play().catch(() => {}); setPlaying(true); } }}
            />
          ) : (thumbUrl || mediaUrl) ? (
            <SmartImage src={thumbUrl || mediaUrl} alt={caption || 'Post'} className="w-full h-full" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-900/40 flex items-center justify-center">
              <Play className="w-10 h-10 text-white/30" />
            </div>
          )}

          {/* Video overlays */}
          {isVideo && (videoLoading || !playing) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
                {videoLoading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Play className="w-6 h-6 text-white fill-white ml-0.5" />}
              </div>
            </div>
          )}
          {isVideo && (
            <button onClick={() => { const v = videoRef.current; if (!v) return; v.muted = !v.muted; setIsMuted(v.muted); }}
              className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
              {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          )}
        </div>

        {/* Actions + Caption */}
        <div className="px-4 pt-3 pb-4">
          <div className="flex items-center gap-4 mb-2">
            <motion.button whileTap={{ scale: 0.7 }} onClick={() => user && toggleLike.mutate()} className="flex items-center gap-1.5">
              <Heart className={`w-6 h-6 transition-colors ${(liked || (itemType === 'reel')) && localLikes > (item.likes_count || item.likes || 0) ? 'fill-primary text-primary' : liked ? 'fill-primary text-primary' : 'text-foreground'}`} />
              <span className="text-sm font-medium">{localLikes}</span>
            </motion.button>
            {itemType === 'post' && (
              <button onClick={() => setShowComments(v => !v)} className="flex items-center gap-1.5">
                <MessageCircle className="w-6 h-6 text-foreground" />
                <span className="text-sm font-medium">{item.comments_count || 0}</span>
              </button>
            )}
            <button onClick={() => setShowShare(v => !v)} className="ml-auto relative">
              <Share2 className="w-5 h-5 text-muted-foreground" />
              {showShare && (
                <div className="absolute bottom-8 right-0 bg-card border border-white/10 rounded-xl shadow-xl z-30 min-w-[140px] overflow-hidden">
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/PublicPostView?id=${item.id}`); setShowShare(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-primary/10 transition-colors border-b border-white/5">
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" /> Copy Link
                  </button>
                  <button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(window.location.origin + '/PublicPostView?id=' + item.id)}`, '_blank'); setShowShare(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-xs hover:bg-primary/10 transition-colors">
                    📱 WhatsApp
                  </button>
                </div>
              )}
            </button>
          </div>

          {caption && (
            <p className="text-sm leading-relaxed">
              <span className="font-semibold mr-1">{avatarName}</span>
              <span className="text-muted-foreground">{caption}</span>
            </p>
          )}

          {/* Comments inline */}
          <AnimatePresence>
            {showComments && itemType === 'post' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 overflow-hidden">
                <div className="space-y-2 mb-2 max-h-32 overflow-y-auto">
                  {comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet.</p>}
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary flex-shrink-0 mt-0.5">{c.commenter_name?.[0] || 'U'}</div>
                      <p className="text-xs"><span className="font-semibold mr-1">{c.commenter_name}</span><span className="text-muted-foreground">{c.content}</span></p>
                    </div>
                  ))}
                </div>
                {user && (
                  <div className="flex gap-2">
                    <input value={commentText} onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && commentText.trim()) addComment.mutate(); }}
                      placeholder="Add a comment..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground" />
                    <button onClick={() => commentText.trim() && addComment.mutate()} disabled={!commentText.trim() || addComment.isPending}
                      className="text-xs text-primary font-semibold disabled:opacity-40">Post</button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}