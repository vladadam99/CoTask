import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import AvatarSearchSection from '@/components/professionals/AvatarSearchSection';
import ExpertSearchSection from '@/components/professionals/ExpertSearchSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Video, Play } from 'lucide-react';

export default function Explore() {
  const { user } = useCurrentUser();
  
  const { data: recentPosts = [] } = useQuery({
    queryKey: ['explore-recent-posts'],
    queryFn: () => base44.entities.Post.filter({ is_published: true }, '-created_date', 12),
  });

  return (
    <AppShell navItems={getNavItems(user?.selected_role)} user={user}>
      <div className="max-w-6xl mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2 tracking-tight">Explore Marketplace</h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Discover verified Local Agents and Experts. View their live availability, reviews, and recent work proof before booking.
          </p>
        </div>

        {recentPosts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" /> Recent Work & Proofs
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
              {recentPosts.map(post => (
                <Link 
                  key={post.id} 
                  to={`/PublicPostView?id=${post.id}`} 
                  className="snap-start shrink-0 w-48 h-64 relative rounded-xl overflow-hidden group bg-muted border border-border"
                >
                  <img src={post.thumbnail_url || post.media_url} alt={post.caption} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-primary/20 overflow-hidden shrink-0">
                        {post.avatar_photo_url ? (
                          <img src={post.avatar_photo_url} alt={post.avatar_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-primary bg-background">
                            {post.avatar_name?.[0]}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-white truncate">{post.avatar_name}</span>
                    </div>
                    <p className="text-[10px] text-white/80 line-clamp-2 leading-tight">{post.caption}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="avatars" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-card border border-border max-w-[400px]">
            <TabsTrigger value="avatars" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">Local Agents</TabsTrigger>
            <TabsTrigger value="experts" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium">Remote Experts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="avatars" className="mt-0 outline-none">
            <AvatarSearchSection user={user} />
          </TabsContent>
          
          <TabsContent value="experts" className="mt-0 outline-none">
            <ExpertSearchSection user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}