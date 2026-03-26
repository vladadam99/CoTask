import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import FeedCard from '@/components/explore/FeedCard';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';

const CATEGORIES = ['All', 'City Guide', 'Shopping', 'Food Tours', 'Museums', 'Travel', 'Events'];

export default function Explore() {
  const { user } = useCurrentUser();
  const [category, setCategory] = useState('All');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['explore-posts', category],
    queryFn: () => {
      if (category === 'All') return base44.entities.Post.filter({ is_published: true }, '-created_date', 50);
      return base44.entities.Post.filter({ is_published: true, category }, '-created_date', 50);
    },
  });

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      {/* Category filter bar — floating on top */}
      <div className="fixed top-14 lg:top-0 left-0 right-0 lg:left-64 z-30 px-4 pt-3 pb-2 bg-gradient-to-b from-background to-transparent">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                cat === category
                  ? 'bg-primary text-white'
                  : 'bg-white/5 border border-white/10 text-muted-foreground hover:border-primary/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Full-screen snap-scroll feed */}
      <div
        className="fixed inset-0 lg:left-64 overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {isLoading ? (
          <div className="h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="h-screen flex flex-col items-center justify-center text-center px-6">
            <p className="text-5xl mb-4">📸</p>
            <h3 className="font-bold text-lg">No posts yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Be the first to post in this category!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="h-screen w-full snap-start">
              <FeedCard post={post} user={user} />
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}