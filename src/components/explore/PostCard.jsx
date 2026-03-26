import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, MessageCircle, Send, X, Play, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function VideoItem({ src, autoPlay }) {
  const videoRef = useRef(null);
  const playPromiseRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (autoPlay) {
      video.muted = true; // always start muted (browser policy)
      setMuted(true);
      playPromiseRef.current = video.play();
      playPromiseRef.current?.then(() => setPlaying(true)).catch(() => {});
    } else {
      if (playPromiseRef.current) {
        playPromiseRef.current.then(() => { video.pause(); video.currentTime = 0; }).catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
      playPromiseRef.current = null;
      setPlaying(false);
    }
  }, [autoPlay, src]);

  const toggleMute = (e) => {
    e.stopPropagation();
    const newMuted = !muted;
    setMuted(newMuted);
    if (videoRef.current) videoRef.current.muted = newMuted;
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        loop playsInline muted={muted}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (!videoRef.current) return;
          playing ? videoRef.current.pause() : videoRef.current.play().catch(() => {});
        }}
      />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>
      )}
      {/* Mute/unmute button - prominent bottom right */}
      <button
        onClick={toggleMute}
        className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur flex items-center justify-center z-10 border border-white/20"
      >
        {muted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
      </button>
    </div>
  );
}

function MediaSlide({ item, autoPlay }) {
  if (item.type === 'video') {
    return <VideoItem src={item.url} autoPlay={autoPlay} />;
  }
  return <img src={item.url} alt="post" className="w-full h-full object-cover" />;
}

function MediaCarousel({ items, activeIndex, setActiveIndex, autoPlayVideos }) {
  const isMulti = items.length > 1;
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40 && activeIndex < items.length - 1) setActiveIndex(i => i + 1);
    else if (diff < -40 && activeIndex > 0) setActiveIndex(i => i - 1);
    touchStartX.current = null;
  };

  return (
    <div
      className="relative w-full h-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div
        className="flex h-full transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)`, width: `${items.length * 100}%` }}
      >
        {items.map((item, i) => (
          <div key={i} className="h-full flex-shrink-0 overflow-hidden" style={{ width: `${100 / items.length}%` }}>
            <MediaSlide item={item} autoPlay={autoPlayVideos && i === activeIndex} />
          </div>
        ))}
      </div>

      {/* Multi-item UI */}
      {isMulti && (
        <>
          {/* Counter badge - top right like Instagram */}
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white text-xs font-semibold px-2.5 py-1 rounded-full z-20 pointer-events-none">
            {activeIndex + 1}/{items.length}
          </div>

          {/* Arrow buttons */}
          {activeIndex > 0 && (
            <button
              onClick={() => setActiveIndex(i => i - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center z-20"
            >
              <ChevronLeft className="w-4 h-4 text-black" />
            </button>
          )}
          {activeIndex < items.length - 1 && (
            <button
              onClick={() => setActiveIndex(i => i + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center z-20"
            >
              <ChevronRight className="w-4 h-4 text-black" />
            </button>
          )}

          {/* Dots - bottom center like Instagram */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none">
            {items.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-200 ${
                  i === activeIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                }`}
              />
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
          <MediaCarousel items={items} activeIndex={activeIndex} setActiveIndex={setActiveIndex} autoPlayVideos={true} />
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

  const items = post.media_items?.length
    ? post.media_items
    : [{ url: post.media_url, type: post.type || 'photo' }];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.5),
      { threshold: 0.5 }
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

      <div ref={cardRef} className="bg-card border-y border-white/5">
        {/* ── Instagram-style header ── */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <button onClick={goToProfile} className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-primary/40">
            {post.avatar_photo_url
              ? <img src={post.avatar_photo_url} alt={post.avatar_name} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">{post.avatar_name?.[0] || 'A'}</div>}
          </button>
          <div className="flex-1 min-w-0">
            <button onClick={goToProfile} className="text-sm font-semibold hover:opacity-80 truncate block text-left">{post.avatar_name || 'Avatar'}</button>
            {post.category && <p className="text-xs text-muted-foreground">{post.category}</p>}
          </div>
          {/* Three dots */}
          <button className="p-1 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
          </button>
        </div>

        {/* ── Full-width square media ── */}
        <div className="w-full aspect-square bg-black overflow-hidden relative">
          <MediaCarousel
            items={items}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            autoPlayVideos={inView}
          />
        </div>

        {/* ── Actions row (Instagram style) ── */}
        <div className="px-3 pt-2 pb-1">
          <div className="flex items-center gap-3 mb-2">
            <motion.button whileTap={{ scale: 0.8 }} onClick={() => user && toggleLike.mutate()} disabled={!user || toggleLike.isPending}>
              <Heart className={`w-6 h-6 transition-colors ${liked ? 'fill-primary text-primary' : 'text-foreground'}`} />
            </motion.button>
            <button onClick={() => setShowComments(v => !v)}>
              <MessageCircle className="w-6 h-6 text-foreground" />
            </button>
            <button onClick={() => setModalOpen(true)} className="ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>
            </button>
          </div>

          {/* Likes count */}
          {(post.likes_count || 0) > 0 && (
            <p className="text-sm font-semibold mb-1">{post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}</p>
          )}

          {/* Caption */}
          {post.caption && (
            <p className="text-sm mb-1">
              <button onClick={goToProfile} className="font-semibold mr-1 hover:opacity-70">{post.avatar_name}</button>
              <span className="text-foreground/90">{post.caption}</span>
            </p>
          )}

          {/* Comments count */}
          {(post.comments_count || 0) > 0 && (
            <button onClick={() => setShowComments(v => !v)} className="text-sm text-muted-foreground mb-1">
              View all {post.comments_count} comments
            </button>
          )}
        </div>

        {/* ── Comments section ── */}
        <AnimatePresence>
          {showComments && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/5">
              <div className="px-3 py-2 space-y-2 max-h-40 overflow-y-auto">
                {comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet.</p>}
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{c.commenter_name?.[0] || 'U'}</div>
                    <div><span className="text-xs font-semibold mr-1">{c.commenter_name}</span><span className="text-xs text-muted-foreground">{c.content}</span></div>
                  </div>
                ))}
              </div>
              {user && (
                <div className="px-3 pb-3 flex gap-2 border-t border-white/5 pt-2">
                  <input value={commentText} onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && commentText.trim()) addComment.mutate(); }}
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground" />
                  <button onClick={() => commentText.trim() && addComment.mutate()} disabled={!commentText.trim() || addComment.isPending}
                    className="text-primary text-sm font-semibold disabled:opacity-40">Post</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}