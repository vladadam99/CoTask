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
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Play,
  Plus,
  Radio,
  Search,
  ShieldCheck,
  Video,
  WalletCards,
} from 'lucide-react';
import { SectionTitle } from '@/components/ui/PagePrimitives';

const decisionSteps = [
  { icon: Search, title: 'Search by outcome', text: 'Describe the task, location, and proof you need.' },
  { icon: ShieldCheck, title: 'Compare real people', text: 'Check ratings, skills, availability, and recent proof.' },
  { icon: WalletCards, title: 'Pay after choosing', text: 'Posting is free. Secure Payment starts after you pick an agent.' },
];

export default function Explore() {
  const { user } = useCurrentUser();
  const activeRole = user?.selected_role || user?.role || 'user';
  const shellRole = activeRole === 'avatar' ? 'user' : activeRole;
  const shellHomePath = shellRole === 'user' ? '/Explore' : undefined;
  
  const { data: recentPosts = [] } = useQuery({
    queryKey: ['explore-recent-posts'],
    queryFn: () => base44.entities.Post.filter({ is_published: true }, '-created_date', 12),
  });

  const visiblePosts = recentPosts.filter(post => !(post.is_live && post.live_status === 'ended'));
  const heroPost = visiblePosts[0];
  const liveCount = visiblePosts.filter(post => post.is_live && post.live_status === 'live').length;

  return (
    <AppShell navItems={getNavItems(shellRole)} user={user} roleOverride={shellRole} homePathOverride={shellHomePath}>
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="p-4 md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                  <Compass className="h-3.5 w-3.5" /> Client marketplace
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  <Radio className="h-3.5 w-3.5" /> {liveCount > 0 ? `${liveCount} live now` : 'Live proof ready'}
                </span>
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-foreground md:text-5xl">
                Find a Local Agent who can be there for you.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Search people by city, task type, live availability, reviews, and proof. Hire directly or post an open task when you want proposals.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link to="/PostJob" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90">
                  <Plus className="w-4 h-4" /> Post Open Task
                </Link>
                <Link to="/ReelFeed" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-bold text-foreground hover:bg-secondary">
                  <Play className="w-4 h-4" /> Watch Proof
                </Link>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {decisionSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="rounded-lg border border-border bg-secondary/45 p-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <Icon className="h-4 w-4 text-primary" />
                        {step.title}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border bg-secondary/45 p-4 lg:border-l lg:border-t-0">
              <Link
                to={heroPost?.is_live && heroPost?.live_status === 'live' ? `/PublicLiveView?post=${heroPost.id}` : heroPost ? `/PublicPostView?id=${heroPost.id}` : '/ReelFeed'}
                className="group block overflow-hidden rounded-lg border border-border bg-card shadow-sm"
              >
                <div className="relative aspect-[4/5] bg-slate-950">
                  {heroPost?.is_live && heroPost?.live_status === 'live' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-400/30 bg-red-500/15">
                        <Radio className="h-8 w-8 text-red-300" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">Public live session</p>
                        <p className="mt-1 text-xs text-white/65">Tap to watch in real time</p>
                      </div>
                    </div>
                  ) : heroPost?.thumbnail_url || heroPost?.media_url ? (
                    <img src={heroPost.thumbnail_url || heroPost.media_url} alt={heroPost.caption || 'Agent proof'} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center">
                      <Video className="h-10 w-10 text-white/70" />
                      <p className="text-sm font-bold text-white">Proof posts appear here</p>
                      <p className="text-xs leading-relaxed text-white/60">Agents can share recorded proof and public live sessions.</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    {heroPost?.is_live && heroPost?.live_status === 'live' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-slate-900">
                      <CheckCircle2 className="h-3 w-3 text-primary" /> Proof
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-xs font-semibold text-white/70">Recent agent proof</p>
                    <h2 className="mt-1 line-clamp-2 text-lg font-black leading-tight text-white">
                      {heroPost?.caption || 'See what agents can verify before you hire.'}
                    </h2>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/75">
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white/15">
                          {heroPost?.avatar_photo_url && <img src={heroPost.avatar_photo_url} alt={heroPost.avatar_name || 'Agent'} className="h-full w-full object-cover" />}
                        </span>
                        <span className="truncate">{heroPost?.avatar_name || 'Local Agent'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-bold">
                        View <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {visiblePosts.length > 0 && (
          <section className="space-y-4">
            <SectionTitle
              eyebrow="Proof feed"
              title="Recent work proof"
              description="Short proof posts and public live sessions from Local Agents."
              action={<Link to="/ReelFeed" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">Open reels <ArrowRight className="h-4 w-4" /></Link>}
            />
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
              {visiblePosts.map(post => (
                <Link 
                  key={post.id} 
                  to={post.is_live && post.live_status === 'live' ? `/PublicLiveView?post=${post.id}` : `/PublicPostView?id=${post.id}`}
                  className="snap-start shrink-0 w-48 h-64 relative rounded-xl overflow-hidden group bg-muted border border-border"
                >
                  {post.is_live && post.live_status === 'live' ? (
                    <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-black to-slate-950 flex flex-col items-center justify-center gap-3 text-center px-4">
                      <div className="h-12 w-12 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                        <Radio className="h-6 w-6 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Live now</p>
                        <p className="mt-1 text-xs text-white/60">Tap to watch</p>
                      </div>
                    </div>
                  ) : (
                    <img src={post.thumbnail_url || post.media_url} alt={post.caption} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                  {post.is_live && post.live_status === 'live' && (
                    <div className="absolute top-2 left-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
                    </div>
                  )}
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
          </section>
        )}

        <Tabs defaultValue="avatars" className="w-full">
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-label">Find help</p>
              <h2 className="text-2xl font-black tracking-tight text-foreground">Choose how you want to start</h2>
              <p className="mt-1 text-sm text-muted-foreground">Browse available people, then book directly or ask for proposals.</p>
            </div>
            <TabsList className="grid w-full grid-cols-2 rounded-lg border border-border bg-card p-1 sm:w-[360px]">
              <TabsTrigger value="avatars" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">Local Agents</TabsTrigger>
              <TabsTrigger value="experts" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">Remote Experts</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="avatars" className="mt-5 outline-none">
            <AvatarSearchSection user={user} />
          </TabsContent>
          
          <TabsContent value="experts" className="mt-5 outline-none">
            <ExpertSearchSection user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

