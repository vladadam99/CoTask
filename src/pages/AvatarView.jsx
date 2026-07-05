import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, SectionTitle } from '@/components/ui/PagePrimitives';
import {
  ArrowLeft,
  MapPin,
  Star,
  Shield,
  Globe,
  Radio,
  Smartphone,
  Wifi,
  Headphones,
  Car,
  Calendar,
  MessageSquare,
  Loader2,
  FileText,
  Download,
  Camera,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';
import ExpertiseOfferingsTab from '@/components/expertise/ExpertiseOfferingsTab';

function PortfolioCard({ post }) {
  return (
    <button type="button" className="group overflow-hidden rounded-lg border border-border bg-card text-left shadow-sm">
      <div className="relative aspect-[4/3] bg-secondary">
        {post.type === 'video' ? (
          <>
            <video src={post.media_url} className="h-full w-full object-cover" playsInline />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm">
                <Camera className="h-5 w-5" />
              </span>
            </span>
          </>
        ) : (
          <img src={post.media_url} alt={post.caption || 'Portfolio media'} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm text-muted-foreground">{post.caption || 'Portfolio media'}</p>
      </div>
    </button>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40'}`} />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{review.reviewer_name || 'Client'}</span>
      </div>
      {review.comment && <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>}
    </div>
  );
}

export default function AvatarView() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const activeRole = user?.selected_role || user?.role || 'user';
  const shellRole = activeRole === 'avatar' ? 'user' : activeRole;
  const shellHomePath = shellRole === 'user' ? '/Explore' : undefined;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const defaultTab = params.get('tab') || 'Portfolio';
  const [messaging, setMessaging] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);

  const { data: avatar, isLoading } = useQuery({
    queryKey: ['avatar', id],
    queryFn: () => base44.entities.AvatarProfile.get(id),
    enabled: !!id,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['avatar-view-posts', avatar?.user_email],
    queryFn: () => base44.entities.Post.filter({ avatar_email: avatar.user_email, is_published: true }, '-created_date', 30),
    enabled: !!avatar?.user_email,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['avatar-reviews', avatar?.user_email],
    queryFn: () => base44.entities.Review.filter({ avatar_email: avatar.user_email }, '-created_date', 10),
    enabled: !!avatar?.user_email,
  });

  const { data: isFavorited = false } = useQuery({
    queryKey: ['is-favorited', user?.email, id],
    queryFn: async () => {
      const favs = await base44.entities.Favorite.filter({
        user_email: user.email,
        avatar_profile_id: id,
      });
      return favs.length > 0;
    },
    enabled: !!user?.email && !!id,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        const favs = await base44.entities.Favorite.filter({
          user_email: user.email,
          avatar_profile_id: id,
        });
        if (favs.length > 0) await base44.entities.Favorite.delete(favs[0].id);
      } else {
        await base44.entities.Favorite.create({
          user_email: user.email,
          avatar_profile_id: id,
          avatar_name: avatar.display_name,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-favorited', user?.email, id] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const startMessage = async () => {
    if (!avatar?.id) return;
    setMessaging(true);
    try {
      const res = await base44.functions.invoke('createDirectConversation', { avatar_profile_id: avatar.id });
      if (res.data?.conversation) {
        navigate(`/Messages?conversation=${res.data.conversation.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMessaging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!avatar) {
    return (
      <AppShell navItems={getNavItems(shellRole)} user={user} roleOverride={shellRole} homePathOverride={shellHomePath}>
        <EmptyState
          title="Local Agent not found"
          description="This profile may have been removed or is no longer active."
          action={<Button variant="outline" onClick={() => navigate('/Explore')}>Back to Discover</Button>}
        />
      </AppShell>
    );
  }

  const equipment = [
    { key: 'has_smartphone', icon: Smartphone, label: 'Smartphone' },
    { key: 'has_data_connection', icon: Wifi, label: 'Reliable data' },
    { key: 'has_headset', icon: Headphones, label: 'Headset' },
    { key: 'has_360_camera', icon: Radio, label: '360 camera' },
    { key: 'has_vehicle', icon: Car, label: 'Vehicle' },
  ].filter((item) => avatar[item.key]);

  const tabs = ['Portfolio', 'Services', 'Reviews', 'Expertise'].concat(avatar.cv_url ? ['CV'] : []);
  const hourlyRate = avatar.hourly_rate || 30;
  const reviewCount = reviews.length || avatar.review_count || 0;

  const profileActions = (
    <>
      <Button asChild size="lg" className="w-full">
        <Link to={`/CreateBooking?avatar=${id}`}>
          <Calendar className="h-4 w-4" /> Request Direct Hire
        </Link>
      </Button>
      <Button variant="outline" size="lg" className="w-full" onClick={startMessage} disabled={messaging}>
        {messaging ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
        Open Messages
      </Button>
      <Button variant="ghost" className="w-full" asChild>
        <Link to="/PostJob">Create a Task instead</Link>
      </Button>
    </>
  );

  return (
    <AppShell navItems={getNavItems(shellRole)} user={user} roleOverride={shellRole} homePathOverride={shellHomePath}>
      <div className="mx-auto max-w-6xl space-y-6 pb-20">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="relative h-56 bg-secondary md:h-72">
            {avatar.cover_url ? (
              <img src={avatar.cover_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full professional-grid bg-secondary" />
            )}
            <div className="absolute right-4 top-4 flex gap-2">
              {avatar.is_verified && (
                <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">
                  <Shield className="mr-1 h-3 w-3" /> Verified
                </Badge>
              )}
              {avatar.is_available && (
                <Badge variant="outline" className="rounded-full border-green-200 bg-green-50 text-green-700">
                  Available
                </Badge>
              )}
            </div>
          </div>

          <div className="grid gap-6 p-5 md:p-7 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              <div className="-mt-20 mb-5 flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="h-32 w-32 overflow-hidden rounded-lg border-4 border-card bg-card shadow-md">
                  {avatar.photo_url ? (
                    <img src={avatar.photo_url} alt={avatar.display_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-4xl font-black text-primary">
                      {avatar.display_name?.[0] || 'A'}
                    </div>
                  )}
                </div>
                <div className="min-w-0 pb-1">
                  <p className="section-label">Local Agent Profile</p>
                  <h1 className="mt-1 text-3xl font-black tracking-tight text-foreground md:text-4xl">{avatar.display_name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {avatar.city || 'Remote'}{avatar.country ? `, ${avatar.country}` : ''}</span>
                    {avatar.rating > 0 && <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {avatar.rating.toFixed(1)} ({reviewCount} reviews)</span>}
                    <span className="inline-flex items-center gap-1.5"><Globe className="h-4 w-4" /> {(avatar.languages || ['English']).join(', ')}</span>
                  </div>
                </div>
              </div>

              {avatar.bio && <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">{avatar.bio}</p>}

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-secondary/45 p-4">
                  <p className="text-xs font-semibold text-muted-foreground">Starting rate</p>
                  <p className="mt-1 text-2xl font-black text-foreground">${hourlyRate}/hr</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/45 p-4">
                  <p className="text-xs font-semibold text-muted-foreground">Review score</p>
                  <p className="mt-1 text-2xl font-black text-foreground">{avatar.rating > 0 ? avatar.rating.toFixed(1) : 'New'}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/45 p-4">
                  <p className="text-xs font-semibold text-muted-foreground">Completed tasks</p>
                  <p className="mt-1 text-2xl font-black text-foreground">{avatar.completed_jobs || avatar.completed_tasks || 0}</p>
                </div>
              </div>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-7 rounded-lg border border-border bg-card p-5 shadow-[0_18px_45px_hsl(222_47%_11%/0.08)]">
                <div className="mb-4">
                  <p className="text-sm font-bold text-foreground">Hire {avatar.display_name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Use Direct Hire when you already know this is the Local Agent you want.
                  </p>
                </div>
                <div className="space-y-2">{profileActions}</div>
              </div>
            </aside>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <main className="space-y-6">
            <GlassCard className="p-5">
              <SectionTitle
                eyebrow="Trust summary"
                title="What this Local Agent offers"
                description="A quick view of services, capabilities, and availability signals."
                className="mb-4"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {(avatar.categories || []).slice(0, 6).map((category) => (
                  <div key={category} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{category}</span>
                  </div>
                ))}
                {equipment.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                ))}
                {avatar.is_verified && (
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold">Identity verification completed</span>
                  </div>
                )}
              </div>
            </GlassCard>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === tab
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}{tab === 'Portfolio' ? ` (${posts.length})` : tab === 'Reviews' ? ` (${reviews.length})` : ''}
                </button>
              ))}
            </div>

            {activeTab === 'Portfolio' && (
              <GlassCard className="p-5">
                <SectionTitle title="Portfolio Media" description="Photos and short media this Local Agent has shared from previous work." className="mb-4" />
                {posts.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {posts.map((post) => <PortfolioCard key={post.id} post={post} />)}
                  </div>
                ) : (
                  <EmptyState icon={Camera} title="No portfolio media yet" description="Portfolio media will appear here once this Local Agent publishes examples." className="p-8" />
                )}
              </GlassCard>
            )}

            {activeTab === 'Services' && (
              <GlassCard className="p-5">
                <SectionTitle title="Services and Categories" description="Task types this Local Agent has listed on their profile." className="mb-4" />
                {(avatar.categories || []).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {avatar.categories.map((category) => (
                      <Badge key={category} variant="outline" className="rounded-full border-border bg-card px-3 py-1.5 text-sm">{category}</Badge>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Briefcase} title="No services listed" description="This Local Agent has not added service categories yet." className="p-8" />
                )}
              </GlassCard>
            )}

            {activeTab === 'Reviews' && (
              <GlassCard className="p-5">
                <SectionTitle title="Client Reviews" description="Feedback from completed CoTask work." className="mb-4" />
                {reviews.length > 0 ? (
                  <div className="grid gap-3">
                    {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
                  </div>
                ) : (
                  <EmptyState icon={Star} title="No reviews yet" description="Reviews will appear after completed tasks." className="p-8" />
                )}
              </GlassCard>
            )}

            {activeTab === 'Expertise' && (
              <GlassCard className="p-5">
                <SectionTitle title="Expert Sessions" description="Consultation or coaching sessions this Local Agent offers." className="mb-4" />
                <ExpertiseOfferingsTab avatarEmail={avatar.user_email} avatarProfileId={avatar.id} />
              </GlassCard>
            )}

            {activeTab === 'CV' && avatar.cv_url && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">CV / Resume</p>
                    <p className="truncate text-sm text-muted-foreground">{avatar.cv_filename || 'Curriculum Vitae'}</p>
                  </div>
                </div>
                <a
                  href={avatar.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/15"
                >
                  <Download className="h-4 w-4" /> Download CV
                </a>
              </GlassCard>
            )}
          </main>

          <aside className="lg:hidden">
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 shadow-[0_-14px_35px_hsl(222_47%_11%/0.12)]">
              <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
                <Button asChild className="h-11">
                  <Link to={`/CreateBooking?avatar=${id}`}>Request Direct Hire</Link>
                </Button>
                <Button variant="outline" className="h-11" onClick={startMessage} disabled={messaging}>
                  Open Messages
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

