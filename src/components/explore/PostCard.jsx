import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, MessageCircle, Send, X, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fullscreen modal for a single post
function MediaModal({ post, user, onClose }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

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

  useEffect(() => {
    if (post.type === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [post.type]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      onClick={onClose}
    >
      <div className="flex flex-col h-full" onClick={e => e.stopPropagation()}>
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent">
          <button
            onClick={() => { onClose(); navigate(`/AvatarView?id=${post.avatar_profile_id}`); }}
            className="flex items-center gap-2 flex-1"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary overflow-hidden">
              {post.avatar_photo_url
                ? <img src={post.avatar_photo_url} alt={post.avatar_name} className="w-full h-full object-cover" />
                : post.avatar_name?.[0] || 'A'}
            </div>
            <span className="text-sm font-semibold text-white">{post.avatar_name || 'Avatar'}</span>
          </button>
          <button onClick={onClose} className="p-1.5 rounded-full bg-black/40">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Media */}
        <div className="flex-1 flex items-center justify-center bg-black relative" onClick={post.type === 'video' ? togglePlay : undefined}>
          {post.type === 'video' ? (
            <>
              <video
                ref={videoRef}
                src={post.media_url}
                className="w-full h-full object-contain"
                loop
                playsInline
                muted={muted}
                onEnded={() => setPlaying(false)}
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button onClick={e => { e.stopPropagation(); setMuted(m => !m); }} className="p-2 rounded-full bg-black/50">
                  {muted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                </button>
              </div>
              {!playing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                    <Play className="w-7 h-7 text-white fill-white ml-1" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <img src={post.media_url} alt={post.caption || 'Post'} className="w-full h-full object-contain" />
          )}
        </div>

        {/* Bottom bar */}
        <div className="bg-black/90 px-4 py-3">
          {post.caption && (
            <p className="text-sm text-white mb-2">
              <span className="font-semibold mr-1">{post.avatar_name}</span>
              {post.caption}
            </p>
          )}
          <div className="flex items-center gap-4 mb-2">
            <motion.button whileTap={{ scale: 0.8 }} onClick={() => user && toggleLike.mutate()} disabled={!user} className="flex items-center gap-1.5">
              <Heart className={`w-6 h-6 ${liked ? 'fill-primary text-primary' : 'text-white'}`} />
              <span className="text-sm text-white">{post.likes_count || 0}</span>
            </motion.button>
            <button onClick={() => setShowComments(v => !v)} className="flex items-center gap-1.5 text-white">
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm">{post.comments_count || 0}</span>
            </button>
          </div>
          <AnimatePresence>
            {showComments && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/10 pt-2">
                <div className="space-y-2 max-h-36 overflow-y-auto mb-2">
                  {comments.length === 0 && <p className="text-xs text-white/50">No comments yet.</p>}
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {c.commenter_name?.[0] || 'U'}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white mr-1">{c.commenter_name}</span>
                        <span className="text-xs text-white/70">{c.content}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {user && (
                  <div className="flex gap-2">
                    <input
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && commentText.trim()) addComment.mutate(); }}
                      placeholder="Add a comment..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
                    />
                    <button onClick={() => commentText.trim() && addComment.mutate()} disabled={!commentText.trim()} className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Send className="w-4 h-4 text-primary" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function PostCard({ post, user }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [playing, setPlaying] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const videoRef = useRef(null);
  const cardRef = useRef(null);

  // Autoplay on scroll into view
  useEffect(() => {
    if (post.type !== 'video') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!videoRef.current) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
        } else {
          videoRef.current.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.6 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
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

  const goToProfile = (e) => {
    e.stopPropagation();
    navigate(`/AvatarView?id=${post.avatar_profile_id}`);
  };

  return (
    <>
      <AnimatePresence>
        {modalOpen && <MediaModal post={post} user={user} onClose={() => setModalOpen(false)} />}
      </AnimatePresence>

      <div ref={cardRef} className="bg-card/50 border border-white/5 rounded-2xl overflow-hidden">
        {/* Header — only this navigates to profile */}
        <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={goToProfile}>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary overflow-hidden flex-shrink-0">
            {post.avatar_photo_url
              ? <img src={post.avatar_photo_url} alt={post.avatar_name} className="w-full h-full object-cover" />
              : post.avatar_name?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold hover:text-primary transition-colors truncate">{post.avatar_name || 'Avatar'}</p>
            {post.category && <p className="text-xs text-muted-foreground">{post.category}</p>}
          </div>
        </div>

        {/* Media — full width, taller, click opens modal */}
        <div
          className="relative bg-black w-full overflow-hidden cursor-pointer"
          style={{ aspectRatio: post.type === 'video' ? '9/16' : '4/5', maxHeight: '75vh' }}
          onClick={() => setModalOpen(true)}
        >
          {post.type === 'video' ? (
            <>
              <video
                ref={videoRef}
                src={post.media_url}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted
                onEnded={() => setPlaying(false)}
              />
              {!playing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <img src={post.media_url} alt={post.caption || 'Post'} className="w-full h-full object-cover" />
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-4 mb-2">
            <motion.button whileTap={{ scale: 0.8 }} onClick={() => user && toggleLike.mutate()} disabled={!user || toggleLike.isPending} className="flex items-center gap-1.5">
              <Heart className={`w-5 h-5 transition-colors ${liked ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium">{post.likes_count || 0}</span>
            </motion.button>
            <button onClick={() => setShowComments(v => !v)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{post.comments_count || 0}</span>
            </button>
          </div>

          {post.caption && (
            <p className="text-sm mb-1">
              <span className="font-semibold mr-1 cursor-pointer hover:text-primary" onClick={goToProfile}>{post.avatar_name}</span>
              {post.caption}
            </p>
          )}
        </div>

        {/* Comments drawer */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/5"
            >
              <div className="px-4 py-3 space-y-3 max-h-48 overflow-y-auto">
                {comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet. Be first!</p>}
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
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
                <div className="px-4 pb-3 flex gap-2">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && commentText.trim()) addComment.mutate(); }}
                    placeholder="Add a comment..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground"
                  />
                  <button onClick={() => commentText.trim() && addComment.mutate()} disabled={!commentText.trim() || addComment.isPending} className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-40">
                    <Send className="w-4 h-4 text-primary" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}