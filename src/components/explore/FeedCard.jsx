import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, MessageCircle, Send, X, Play, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedCard({ post, user, isActive = true, isNear = true }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [mediaIndex, setMediaIndex] = useState(0);
  const [videoLoading, setVideoLoading] = useState(false);

  const mediaList = (post.media_urls && post.media_urls.length > 0)
    ? post.media_urls.map((url, i) => ({ url, type: post.media_types?.[i] || 'photo' }))
    : [{ url: post.media_url, type: post.type || 'photo' }];
  const currentMedia = mediaList[mediaIndex];
  const isMulti = mediaList.length > 1;

  useEffect(() => { setMediaIndex(0); }, [post.id]);

  // Autoplay when visible
  useEffect(() => {
    if (currentMedia.type !== 'video') return;
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      video.muted = true;
      setIsMuted(true);
      if (video.readyState >= 3) {
        // Already buffered enough — play immediately
        video.play().catch(() => {});
        setPlaying(true);
        setVideoLoading(false);
      } else {
        setVideoLoading(true);
        const onReady = () => {
          setVideoLoading(false);
          video.play().catch(() => {});
          setPlaying(true);
        };
        video.addEventListener('canplay', onReady, { once: true });
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      const v = videoRef.current;
      if (!v) return;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        tryPlay();
      } else {
        v.pause();
        setPlaying(false);
        setVideoLoading(false);
      }
    }, { threshold: 0.5 });

    if (cardRef.current) observer.observe(cardRef.current);
    return () => {
      observer.disconnect();
      if (video) video.pause();
    };
  }, [currentMedia.type, currentMedia.url, mediaIndex]);

  const { data: liked = false } = useQuery({
    queryKey: ['post-liked', user?.email, post.id],
    queryFn: async () => {
      const likes = await base44.entities.PostLike.filter({ post_id: post.id, user_email: user.email });
      return likes.length > 0;
    },
    enabled: !!user,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['post-comments', post.id],
    queryFn: () => base44.entities.PostComment.filter({ post_id: post.id }, '-created_date', 20),
    enabled: showComments,
  });

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (liked) {
        const likes = await base44.entities.PostLike.filter({ post_id: post.id, user_email: user.email });
        if (likes[0]) await base44.entities.PostLike.delete(likes[0].id);
        await base44.entities.Post.update(post.id, { likes_count: Math.max(0, (post.likes_count || 0) - 1) });
      } else {
        await base44.entities.PostLike.create({ post_id: post.id, user_email: user.email });
        await base44.entities.Post.update(post.id, { likes_count: (post.likes_count || 0) + 1 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-liked', user?.email, post.id] });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
    },
  });

  const addComment = useMutation({
    mutationFn: async () => {
      await base44.entities.PostComment.create({
        post_id: post.id,
        commenter_email: user.email,
        commenter_name: user.full_name || user.email,
        content: commentText.trim(),
      });
      await base44.entities.Post.update(post.id, { comments_count: (post.comments_count || 0) + 1 });
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['post-comments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
    },
  });

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) { video.pause(); setPlaying(false); }
    else { video.play().catch(() => {}); setPlaying(true); }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div ref={cardRef} className="relative w-full h-full bg-black overflow-hidden">

      {/* Media carousel */}
      <div className="absolute inset-0">
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${(mediaIndex / mediaList.length) * 100}%)`, width: `${mediaList.length * 100}%` }}
        >
          {mediaList.map((media, i) => (
            <div key={i} className="h-full flex-shrink-0" style={{ width: `${100 / mediaList.length}%` }}>
              {media.type === 'video' ? (
                <video
                  ref={i === mediaIndex ? videoRef : null}
                  src={media.url}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  muted
                  preload={isNear ? 'auto' : 'none'}
                  onClick={togglePlay}
                />
              ) : (
                <img
                  src={media.url}
                  alt={post.caption || 'Post'}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              )}
            </div>
          ))}
        </div>

        {/* Tap zones for prev/next */}
        {isMulti && (
          <>
            <div
              className="absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer"
              onClick={() => mediaIndex > 0 && setMediaIndex(i => i - 1)}
            />
            <div
              className="absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer"
              onClick={() => mediaIndex < mediaList.length - 1 && setMediaIndex(i => i + 1)}
            />
          </>
        )}

        {/* Dot indicators */}
        {isMulti && (
          <div className="absolute top-16 left-0 right-0 flex justify-center gap-1.5 z-10">
            {mediaList.map((_, i) => (
              <button
                key={i}
                onClick={() => setMediaIndex(i)}
                className={`rounded-full transition-all ${i === mediaIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Play / loading overlay */}
      {currentMedia.type === 'video' && (videoLoading || !playing) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
            {videoLoading
              ? <Loader2 className="w-7 h-7 text-white animate-spin" />
              : <Play className="w-7 h-7 text-white fill-white ml-1" />}
          </div>
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none z-10" />

      {/* Top: Avatar info */}
      <div className="absolute top-0 left-0 right-0 px-4 pt-16 lg:pt-4 flex items-center gap-3 z-20">
        <button
          onClick={() => navigate(`/AvatarView?id=${post.avatar_profile_id}`)}
          className="flex items-center gap-2"
        >
          <div className="w-9 h-9 rounded-full bg-primary/30 overflow-hidden border-2 border-white/20 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white">
            {post.avatar_photo_url
              ? <img src={post.avatar_photo_url} alt={post.avatar_name} className="w-full h-full object-cover" />
              : post.avatar_name?.[0] || 'A'}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white leading-tight">{post.avatar_name || 'Avatar'}</p>
            {post.category && <p className="text-xs text-white/60">{post.category}</p>}
          </div>
        </button>
      </div>

      {/* Right side actions */}
      <div className="absolute right-3 bottom-32 lg:bottom-24 flex flex-col items-center gap-5 z-20">
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.7 }}
            onClick={() => user && toggleLike.mutate()}
            disabled={!user}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
          >
            <Heart className={`w-6 h-6 ${liked ? 'fill-primary text-primary' : 'text-white'}`} />
          </motion.button>
          <span className="text-xs text-white font-medium">{post.likes_count || 0}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => setShowComments(v => !v)}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </button>
          <span className="text-xs text-white font-medium">{post.comments_count || 0}</span>
        </div>

        {currentMedia.type === 'video' && (
          <button
            onClick={toggleMute}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </button>
        )}
      </div>

      {/* Bottom: Caption */}
      <div className="absolute bottom-20 lg:bottom-6 left-4 right-16 z-20">
        {post.caption && (
          <p className="text-sm text-white leading-relaxed">
            <span className="font-bold mr-1">{post.avatar_name}</span>
            {post.caption}
          </p>
        )}
      </div>

      {/* Comments sheet */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 bg-card/95 backdrop-blur-xl rounded-t-3xl z-30 flex flex-col max-h-[60%]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="font-bold text-sm">{post.comments_count || 0} Comments</h3>
              <button onClick={() => setShowComments(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No comments yet. Be first!</p>}
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {c.commenter_name?.[0] || 'U'}
                  </div>
                  <div>
                    <span className="text-xs font-semibold mr-1">{c.commenter_name}</span>
                    <span className="text-xs text-muted-foreground">{c.content}</span>
                  </div>
                </div>
              ))}
            </div>
            {user && (
              <div className="px-4 py-3 border-t border-white/10 flex gap-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && commentText.trim()) addComment.mutate(); }}
                  placeholder="Add a comment..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground"
                />
                <button
                  onClick={() => commentText.trim() && addComment.mutate()}
                  disabled={!commentText.trim() || addComment.isPending}
                  className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-40"
                >
                  <Send className="w-4 h-4 text-primary" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}