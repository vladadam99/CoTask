import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import FeedCard from '@/components/explore/FeedCard';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';

export default function Explore() {
  const { user } = useCurrentUser();
  const [category, setCategory] = useState('All');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['explore-posts', category],
    queryFn: () => {
      if (category === 'All') return base44.entities.Post.filter({ is_published: true }, '-created_date', 50);
      return base44.entities.Post.filter({ is_published: true, category }, '-created_date', 50);
    },
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || posts.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          const idx = parseInt(entry.target.dataset.idx);
          if (!isNaN(idx)) setActiveIndex(idx);
        }
      });
    }, { root: container, threshold: 0.5 });

    container.querySelectorAll('[data-idx]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [posts]);

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user} fullBleed>
      <div
        ref={containerRef}
        className="fixed top-14 lg:top-0 bottom-20 lg:bottom-0 left-0 lg:left-64 right-0 overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <p className="text-5xl mb-4">📸</p>
            <h3 className="font-bold text-lg">No posts yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Be the first to post in this category!</p>
          </div>
        ) : (
          posts.map((post, idx) => (
            <div key={post.id} data-idx={idx} className="w-full snap-start h-[calc(100vh-136px)] lg:h-screen">
              <FeedCard
                post={post}
                user={user}
                isActive={idx === activeIndex}
                isNear={Math.abs(idx - activeIndex) <= 1}
              />
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}