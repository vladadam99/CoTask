import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, MessageCircle, Send, Bookmark, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

// Global sound unlock — once user taps anywhere, videos can play with sound
let globalSoundUnlocked = false;
const soundUnlockListeners = new Set();
function unlockSound() {
  if (globalSoundUnlocked) return;
  globalSoundUnlocked = true;
  soundUnlockListeners.forEach(fn => fn());
  soundUnlockListeners.clear();
}
if (typeof window !== 'undefined') {
  window.addEventListener('click', unlockSound, { once: true });
  window.addEventListener('touchend', unlockSound, { once: true });
}

function VideoSlide({ src, active }) {
  const videoRef = useRef(null);
  const playPromiseRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [showSoundHint, setShowSoundHint] = useState(false);

  const tryUnmute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = false;
    setMuted(false);
    setShowSoundHint(false);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (active) {
      video.muted = true;
      setMuted(true);
      playPromiseRef.current = video.play();
      playPromiseRef.current?.then(() => {
        // Try to unmute if already unlocked
        if (globalSoundUnlocked) {
          tryUnmute();
        } else {
          setShowSoundHint(true);
          soundUnlockListeners.add(() => {
            tryUnmute();
            setShowSoundHint(false);
          });
        }
      }).catch(() => {});
    } else {
      if (playPromiseRef.current) {
        playPromiseRef.current.then(() => {
          video.pause();
          video.currentTime = 0;
        }).catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
      playPromiseRef.current = null;
      setShowSoundHint(false);
    }
  }, [active, src]);

  const toggleMute = (e) => {
    e.stopPropagation();
    unlockSound();
    const newMuted = !muted;
    if (videoRef.current) videoRef.current.muted = newMuted;
    setMuted(newMuted);
    setShowSoundHint(false);
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        loop playsInline muted
      />
      {/* Sound button */}
      <button
        onClick={toggleMute}
        className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20"
      >
        {muted
          ? <><VolumeX className="w-4 h-4 text-white" /><span className="text-white text-xs font-medium">Tap for sound</span></>
          : <Volume2 className="w-4 h-4 text-white" />}
      </button>
      {/* "Tap for sound" hint overlay on first load */}
      {showSoundHint && muted && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)' }}
        >
          <div className="absolute bottom-14 right-3 animate-bounce pointer-events-none">
            <div className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <VolumeX className="w-3.5 h-3.5" /> Tap for sound
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaCarousel({ items, activeIndex, setActiveIndex, inView }) {
  const isMulti = items.length > 1;
  const touchStartX = useRef(null);

  const prev = (e) => { e.stopPropagation(); setActiveIndex(i => Math.max(0, i - 1)); };
  const next = (e) => { e.stopPropagation(); setActiveIndex(i => Math.min(items.length - 1, i + 1)); };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) setActiveIndex(i => Math.min(items.length - 1, i + 1));
    else if (diff < -40) setActiveIndex(i => Math.max(0, i - 1));
    touchStartX.current = null;
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: '1/1' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slider */}
      <div
        className="flex h-full transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)`, width: `${items.length * 100}%` }}
      >
        {items.map((item, i) => (
          <div key={i} className="h-full flex-shrink-0 bg-black" style={{ width: `${100 / items.length}%` }}>
            {item.type === 'video'
              ? <VideoSlide src={item.url} active={inView && i === activeIndex} />
              : <img src={item.url} alt="" className="w-full h-full object-cover" draggable={false} />}
          </div>
        ))}
      </div>

      {/* Multi-item controls */}
      {isMulti && (
        <>
          {/* Counter badge */}
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full z-10 pointer-events-none">
            {activeIndex + 1}/{items.length}
          </div>

          {/* Arrows */}
          {activeIndex > 0 && (
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center z-10">
              <ChevronLeft className="w-4 h-4 text-black" />
            </button>
          )}
          {activeIndex < items.length - 1 && (
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center z-10">
              <ChevronRight className="w-4 h-4 text-black" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function PostCard({ post, user }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const cardRef = useRef(null);

  const items = post.media_items?.length
    ? post.media_items
    : [{ url: post.media_url, type: post.type || 'photo' }];
  const isMulti = items.length > 1;

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

  const goToProfile = () => navigate(`/AvatarView?id=${post.avatar_profile_id}`);

  const timeAgo = post.created_date
    ? formatDistanceToNow(new Date(post.created_date), { addSuffix: true })
    : '';

  return (
    <div ref={cardRef} className="w-full" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>

      {/* ── HEADER ── */}
      <div className="flex items-center gap-2.5 px-3 py-2">
        <button onClick={goToProfile} className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary/50 ring-offset-1 ring-offset-background">
            {post.avatar_photo_url
              ? <img src={post.avatar_photo_url} alt={post.avatar_name} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">{post.avatar_name?.[0] || 'A'}</div>}
          </div>
        </button>
        <div className="flex-1 min-w-0" onClick={goToProfile}>
          <p className="text-[13px] font-bold leading-tight truncate">{post.avatar_name || 'Avatar'}</p>
          {post.category && <p className="text-[11px] text-muted-foreground leading-tight truncate">{post.category}</p>}
        </div>
        <button className="p-1 text-foreground/70">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
          </svg>
        </button>
      </div>

      {/* ── MEDIA ── */}
      <MediaCarousel
        items={items}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        inView={inView}
      />

      {/* ── CAROUSEL DOTS ── */}
      {isMulti && (
        <div className="flex justify-center gap-1.5 pt-2">
          {items.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-200 ${
                i === activeIndex
                  ? 'w-2 h-2 bg-primary'
                  : 'w-1.5 h-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div className="flex items-center px-3 pt-2 pb-1 gap-3">
        {/* Like */}
        <motion.button
          whileTap={{ scale: 0.75 }}
          onClick={() => user && toggleLike.mutate()}
          disabled={!user || toggleLike.isPending}
          className="flex items-center gap-1"
        >
          <Heart className={`w-6 h-6 ${liked ? 'fill-red-500 text-red-500' : 'text-foreground'}`} />
        </motion.button>
        {/* Comment */}
        <button onClick={() => setShowComments(v => !v)} className="flex items-center gap-1">
          <MessageCircle className="w-6 h-6 text-foreground" />
        </button>
        {/* Share */}
        <button className="flex items-center gap-1">
          <Send className="w-5 h-5 text-foreground" />
        </button>
        {/* Bookmark far right */}
        <button className="ml-auto">
          <Bookmark className="w-6 h-6 text-foreground" />
        </button>
      </div>

      {/* ── LIKES COUNT ── */}
      <div className="px-3 pb-1">
        {(post.likes_count || 0) > 0 && (
          <p className="text-[13px] font-bold">{post.likes_count.toLocaleString()} {post.likes_count === 1 ? 'like' : 'likes'}</p>
        )}

        {/* ── CAPTION ── */}
        {post.caption && (
          <p className="text-[13px] leading-snug mt-0.5">
            <button onClick={goToProfile} className="font-bold mr-1">{post.avatar_name}</button>
            <span>{post.caption}</span>
          </p>
        )}

        {/* ── VIEW COMMENTS ── */}
        {(post.comments_count || 0) > 0 && (
          <button
            onClick={() => setShowComments(v => !v)}
            className="text-[13px] text-muted-foreground mt-0.5 block"
          >
            View all {post.comments_count} comments
          </button>
        )}

        {/* ── TIMESTAMP ── */}
        {timeAgo && (
          <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wide">{timeAgo}</p>
        )}
      </div>

      {/* ── COMMENTS ── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-1 space-y-1 max-h-36 overflow-y-auto">
              {comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet.</p>}
              {comments.map(c => (
                <p key={c.id} className="text-[13px]">
                  <span className="font-bold mr-1">{c.commenter_name}</span>
                  <span>{c.content}</span>
                </p>
              ))}
            </div>
            {user && (
              <div className="flex items-center gap-2 px-3 pb-3 pt-1 border-t border-white/5">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                  {user.full_name?.[0] || 'U'}
                </div>
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && commentText.trim()) addComment.mutate(); }}
                  placeholder="Add a comment..."
                  className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {commentText.trim() && (
                  <button
                    onClick={() => addComment.mutate()}
                    disabled={addComment.isPending}
                    className="text-primary text-[13px] font-semibold"
                  >
                    Post
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}