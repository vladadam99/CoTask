import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import FeedCard from '@/components/explore/FeedCard';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { EmptyState } from '@/components/ui/PagePrimitives';
import { Camera, Sparkles } from 'lucide-react';

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
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user} fullBleed title="Explore">
      <div className="fixed left-0 right-0 top-14 z-30 px-3 pt-3 lg:left-72 lg:top-0 lg:px-6 lg:pt-5">
        <div className="surface-panel rounded-lg p-3 shadow-lg md:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="section-label">Agent proof feed</p>
              <h1 className="text-lg font-black tracking-tight text-foreground md:text-xl">Watch what Local Agents can do</h1>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar md:max-w-[58%]">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`app-chip flex-shrink-0 ${cat === category ? 'app-chip-active' : ''}`}
                >
                  {cat === 'All' && <Sparkles className="h-3.5 w-3.5" />}
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="fixed inset-0 overflow-y-scroll snap-y snap-mandatory bg-background lg:left-72"
        style={{ scrollbarWidth: 'none' }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {isLoading ? (
          <div className="h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex h-screen items-center justify-center px-4 pt-28">
            <EmptyState
              icon={Camera}
              title="No proof posts yet"
              description="When Local Agents publish work samples for this category, they will appear here."
              className="max-w-md"
            />
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

