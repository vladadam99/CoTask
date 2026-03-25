import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, MessageCircle, Play, MapPin, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostCard({ post, user }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);

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
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className="bg-card/50 border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link to={`/AvatarView?id=${post.avatar_profile_id}`}>
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary overflow-hidden flex-shrink-0">
            {post.avatar_photo_url
              ? <img src={post.avatar_photo_url} alt={post.avatar_name} className="w-full h-full object-cover" />
              : post.avatar_name?.[0] || 'A'}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/AvatarView?id=${post.avatar_profile_id}`}>
            <p className="text-sm font-semibold hover:text-primary transition-colors truncate">{post.avatar_name || 'Avatar'}</p>
          </Link>
          {post.category && <p className="text-xs text-muted-foreground">{post.category}</p>}
        </div>
      </div>

      {/* Media */}
      <div className="relative bg-black aspect-square overflow-hidden cursor-pointer" onClick={post.type === 'video' ? togglePlay : undefined}>
        {post.type === 'video' ? (
          <>
            <video
              ref={videoRef}
              src={post.media_url}
              className="w-full h-full object-cover"
              loop
              playsInline
              onEnded={() => setPlaying(false)}
            />
            {!playing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                </div>
              </div>
            )}
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
              {post.duration_seconds ? `${Math.round(post.duration_seconds)}s` : 'video'}
            </div>
          </>
        ) : (
          <img src={post.media_url} alt={post.caption || 'Post'} className="w-full h-full object-cover" />
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-4 mb-2">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => user && toggleLike.mutate()}
            disabled={!user || toggleLike.isPending}
            className="flex items-center gap-1.5"
          >
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
            <span className="font-semibold mr-1">{post.avatar_name}</span>
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