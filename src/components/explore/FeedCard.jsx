import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, MessageCircle, Send, X, Play, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedCard({ post, user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Autoplay with sound when scrolled into view
  useEffect(() => {
    if (post.type !== 'video') return;
    let cancelled = false;
    const observer = new IntersectionObserver(([entry]) => {
      const video = videoRef.current;
      if (!video) return;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
        cancelled = false;
        video.muted = true;
        const p = video.play();
        if (p) {
          p.then(() => {
            if (!cancelled && videoRef.current) {
              videoRef.current.muted = false;
              setMuted(false);
              setPlaying(true);
            }
          }).catch(() => {});
        }
      } else {
        cancelled = true;
        video.muted = true;
        setMuted(true);
        const p = video.play();
        if (p) p.then(() => { video.pause(); }).catch(() => {});
        else video.pause();
        setPlaying(false);
      }
    }, { threshold: 0.7 });
    if (cardRef.current) observer.observe(cardRef.current);
    return () => { cancelled = true; observer.disconnect(); };
  }, [post.type]);

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
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play().catch(() => {}); setPlaying(true); }
  };

  return (
    <div ref={cardRef} className="relative w-full h-full bg-black flex-shrink-0 snap-start">
      {/* Media */}
      {post.type === 'video' ? (
        <video
          ref={videoRef}
          src={post.media_url}
          className="w-full h-full object-cover"
          loop
          playsInline
          muted={muted}
          onClick={togglePlay}
        />
      ) : (
        <img src={post.media_url} alt={post.caption || 'Post'} className="w-full h-full object-cover" />
      )}

      {/* Play overlay */}
      {post.type === 'video' && !playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Top: Avatar info */}
      <div className="absolute top-0 left-0 right-0 px-4 pt-4 flex items-center gap-3">
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
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
        {/* Like */}
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

        {/* Comment */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => setShowComments(v => !v)}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </button>
          <span className="text-xs text-white font-medium">{post.comments_count || 0}</span>
        </div>

        {/* Mute — only for videos */}
        {post.type === 'video' && (
          <button
            onClick={() => {
              if (videoRef.current) videoRef.current.muted = !muted;
              setMuted(v => !v);
            }}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center"
          >
            {muted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </button>
        )}
      </div>

      {/* Bottom: Caption */}
      <div className="absolute bottom-6 left-4 right-16">
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
            className="absolute inset-x-0 bottom-0 bg-card/95 backdrop-blur-xl rounded-t-3xl z-20 flex flex-col max-h-[60%]"
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