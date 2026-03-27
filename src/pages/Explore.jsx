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
          posts.map((post, idx) => (
            <div key={post.id} className="h-screen w-full snap-start">
              <FeedCard post={post} user={user} />
              {/* Preload next 2 posts' media */}
              {[1, 2].map(offset => posts[idx + offset] && (
                <link
                  key={offset}
                  rel="preload"
                  as={posts[idx + offset].type === 'video' ? 'fetch' : 'image'}
                  href={posts[idx + offset].media_url}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}