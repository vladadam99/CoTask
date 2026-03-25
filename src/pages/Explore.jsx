import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PostCard from '@/components/explore/PostCard';
import { ArrowLeft, Search } from 'lucide-react';
import { getNavItems } from '@/lib/navItems';
import AppShell from '@/components/layout/AppShell';

const CATEGORIES = ['All', 'City Guide', 'Property Walkthrough', 'Shopping Help', 'Event Attendance', 'Queue & Errands', 'Travel Assistance', 'Training & Coaching'];

export default function Explore() {
  const { user } = useCurrentUser();
  const [category, setCategory] = useState('All');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['explore-posts', category],
    queryFn: () => {
      if (category === 'All') return base44.entities.Post.filter({ is_published: true }, '-created_date', 30);
      return base44.entities.Post.filter({ is_published: true, category }, '-created_date', 30);
    },
  });

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-black">Explore</h1>
          <Link to="/FindAvatars" className="text-sm text-primary font-medium hover:underline">Browse Avatars →</Link>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-0.5 px-0.5 mb-5">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                cat === category
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white/5 border border-white/10 text-muted-foreground hover:border-primary/30'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-2xl bg-card/40 border border-white/5 animate-pulse">
                <div className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                    <div className="h-2.5 bg-white/10 rounded w-1/4" />
                  </div>
                </div>
                <div className="aspect-square bg-white/5" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-1/4" />
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-4xl">📸</p>
            <h3 className="font-bold">No posts yet</h3>
            <p className="text-sm text-muted-foreground">Avatars haven't posted in this category yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} user={user} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}