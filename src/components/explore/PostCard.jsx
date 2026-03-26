import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, MessageCircle, Send, X, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Single media item (video or photo) used in both card and modal
function MediaItem({ item, autoPlay, onPlay, onPause }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (item.type !== 'video' || !videoRef.current) return;
    const video = videoRef.current;
    if (autoPlay) {
      video.muted = false;
      setMuted(false);
      const p = video.play();
      if (p) p.then(() => { setPlaying(true); onPlay?.(); }).catch(err => {
        if (err.name !== 'AbortError') console.warn(err);
      });
    } else {
      video.muted = true;
      setMuted(true);
      // Delay pause to avoid interrupting an in-flight play() promise
      const t = setTimeout(() => { video.pause(); setPlaying(false); onPause?.(); }, 50);
      return () => clearTimeout(t);
    }
  }, [autoPlay, item.url]);

  if (item.type === 'video') {
    return (
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          src={item.url}
          className="w-full h-full object-cover cursor-pointer"
          loop playsInline muted={muted}
          onPlay={() => { setPlaying(true); onPlay?.(); }}
          onPause={() => { setPlaying(false); onPause?.(); }}
          onEnded={() => { setPlaying(false); onPause?.(); }}
          onClick={() => {
            if (!videoRef.current) return;
            if (playing) { videoRef.current.pause(); } else { videoRef.current.play().catch(() => {}); }
          }}
        />
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>
          </div>
        )}
        <button
          onClick={() => {
            const newMuted = !muted;
            setMuted(newMuted);
            if (videoRef.current) videoRef.current.muted = newMuted;
          }}
          className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 text-white z-10"
        >
          {muted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-4-4H4V10h4l4-4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728" /></svg>
          )}
        </button>
      </div>
    );
  }
  return <img src={item.url} alt="post" className="w-full h-full object-cover" />;
}

// Carousel used in both card and modal
function MediaCarousel({ items, activeIndex, setActiveIndex, autoPlayIndex }) {
  const isMulti = items.length > 1;
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="flex h-full transition-transform duration-300"
        style={{ transform: `translateX(-${activeIndex * 100}%)`, width: `${items.length * 100}%` }}
      >
        {items.map((item, i) => (
          <div key={i} className="h-full flex-shrink-0" style={{ width: `${100 / items.length}%` }}>
            <MediaItem item={item} autoPlay={autoPlayIndex === i} />
          </div>
        ))}
      </div>
      {isMulti && (
        <>
          {activeIndex > 0 && (
            <button onClick={() => setActiveIndex(i => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white z-10">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {activeIndex < items.length - 1 && (
            <button onClick={() => setActiveIndex(i => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white z-10">
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {items.map((_, i) => (
              <button key={i} onClick={() => setActiveIndex(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIndex ? 'bg-white w-3' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Fullscreen modal
function MediaModal({ post, user, onClose }) {
  const items = post.media_items?.length ? post.media_items : [{ url: post.media_url, type: post.type }];
  const [activeIndex, setActiveIndex] = useState(0);
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col" onClick={onClose}>
      <div className="flex flex-col h-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent">
          <button onClick={() => { onClose(); navigate(`/AvatarView?id=${post.avatar_profile_id}`); }} className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary overflow-hidden">
              {post.avatar_photo_url ? <img src={post.avatar_photo_url} alt={post.avatar_name} className="w-full h-full object-cover" /> : post.avatar_name?.[0] || 'A'}
            </div>
            <span className="text-sm font-semibold text-white">{post.avatar_name || 'Avatar'}</span>
          </button>
          <button onClick={onClose} className="p-1.5 rounded-full bg-black/40"><X className="w-5 h-5 text-white" /></button>
        </div>
        <div className="flex-1 relative">
          <MediaCarousel items={items} activeIndex={activeIndex} setActiveIndex={setActiveIndex} autoPlayIndex={activeIndex} />
        </div>
        <div className="bg-black/90 px-4 py-3">
          {post.caption && <p className="text-sm text-white mb-2"><span className="font-semibold mr-1">{post.avatar_name}</span>{post.caption}</p>}
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
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{c.commenter_name?.[0] || 'U'}</div>
                      <div><span className="text-xs font-semibold text-white mr-1">{c.commenter_name}</span><span className="text-xs text-white/70">{c.content}</span></div>
                    </div>
                  ))}
                </div>
                {user && (
                  <div className="flex gap-2">
                    <input value={commentText} onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && commentText.trim()) addComment.mutate(); }}
                      placeholder="Add a comment..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none" />
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
  const [modalOpen, setModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const cardRef = useRef(null);

  const items = post.media_items?.length ? post.media_items : [{ url: post.media_url, type: post.type }];
  const currentItem = items[activeIndex];

  // Intersection observer — trigger autoplay
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.6),
      { threshold: 0.6 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

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
        {/* Header */}
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
          {items.length > 1 && (
            <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">{activeIndex + 1}/{items.length}</span>
          )}
        </div>

        {/* Media carousel */}
        <div
          className="relative bg-black w-full overflow-hidden"
          style={{ aspectRatio: currentItem?.type === 'video' ? '9/16' : '4/5', maxHeight: '75vh' }}
        >
          <MediaCarousel
            items={items}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            autoPlayIndex={inView ? activeIndex : -1}
          />
          {/* Fullscreen button */}
          <button onClick={() => setModalOpen(true)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>
          </button>
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

        {/* Comments */}
        <AnimatePresence>
          {showComments && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/5">
              <div className="px-4 py-3 space-y-3 max-h-48 overflow-y-auto">
                {comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet. Be first!</p>}
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{c.commenter_name?.[0] || 'U'}</div>
                    <div>
                      <span className="text-xs font-semibold mr-1">{c.commenter_name}</span>
                      <span className="text-xs text-muted-foreground">{c.content}</span>
                    </div>
                  </div>
                ))}
              </div>
              {user && (
                <div className="px-4 pb-3 flex gap-2">
                  <input value={commentText} onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && commentText.trim()) addComment.mutate(); }}
                    placeholder="Add a comment..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground" />
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