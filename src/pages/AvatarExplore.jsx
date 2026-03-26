import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PostCard from '@/components/explore/PostCard';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';

const CATEGORIES = ['All', 'City Guide', 'Property Walkthrough', 'Shopping Help', 'Event Attendance', 'Travel Assistance'];

export default function AvatarExplore() {
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
    <AppShell navItems={getNavItems(user?.role)} user={user} fullBleed>
      <div className="max-w-lg mx-auto">
        {/* Header + filters — padded */}
        <div className="px-4 pt-4">
          <h1 className="text-xl font-black mb-4">Explore</h1>
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  cat === category ? 'bg-primary text-white' : 'bg-white/5 border border-white/10 text-muted-foreground hover:border-primary/30'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Posts — full-width, no padding */}
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="bg-card/40" style={{aspectRatio:'4/5'}} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📸</p>
            <h3 className="font-bold">No posts yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Be the first to post in this category!</p>
          </div>
        ) : (
          <div>
            {posts.map(post => <PostCard key={post.id} post={post} user={user} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}