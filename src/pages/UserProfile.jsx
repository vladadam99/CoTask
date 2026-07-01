import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, MoreVertical, Star, MapPin, Briefcase, Pencil, FileText, ShieldCheck, CalendarDays, Clock
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';

const TABS = ['Jobs Posted', 'Reviews', 'About'];

export default function UserProfile() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Jobs Posted');
  const [menuOpen, setMenuOpen] = useState(false);

  const profilePicUrl = user?.profile_picture_url || '';
  const coverUrl = user?.cover_picture_url || '';

  const { data: jobPosts = [] } = useQuery({
    queryKey: ['my-job-posts', user?.email],
    queryFn: () => base44.entities.JobPost.filter({ posted_by_email: user.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['my-reviews', user?.email],
    queryFn: () => base44.entities.Review.filter({ reviewed_email: user.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const dashPath = '/FindAvatars';

  return (
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
      <div className="max-w-2xl mx-auto -mt-4 -mx-4 lg:mx-auto lg:mt-0 pb-24 lg:pb-0">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 sticky top-14 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(dashPath)} className="p-1.5 rounded-lg hover:bg-secondary">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-base">{user?.display_name || user?.full_name || 'Profile'}</span>
          </div>
          <div className="relative">
            <button onClick={() => setMenuOpen(v => !v)} className="p-2 rounded-lg hover:bg-secondary">
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-20 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                  <Link to="/UserProfileEdit" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/60 transition-colors">
                    <Pencil className="w-4 h-4 text-muted-foreground" /> Edit Profile
                  </Link>
                  <Link to="/UserSettings" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/60 transition-colors">
                    <FileText className="w-4 h-4 text-muted-foreground" /> Settings
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cover + Avatar */}
        <div className="relative">
          <div className="w-full h-40 bg-gradient-to-br from-primary/30 to-primary/5 overflow-hidden">
            {coverUrl
              ? <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
              : <div className="w-full h-full" />}
          </div>
          <div className="absolute -bottom-10 left-4">
            <div className="w-20 h-20 rounded-full border-4 border-background bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary overflow-hidden">
              {profilePicUrl
                ? <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                : (user?.full_name?.[0] || 'U')}
            </div>
          </div>
        </div>

        {/* Name / role */}
        <div className="pt-14 px-4 pb-4 border-b border-border">
          <h1 className="text-xl font-bold">{user?.display_name || user?.full_name || 'User'}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className="bg-primary/10 text-primary border-primary/20 capitalize text-xs">
              {user?.selected_role || 'user'}
            </Badge>
            {user?.city && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />{user.city}
              </span>
            )}
            {avgRating && (
              <span className="flex items-center gap-1 text-xs text-yellow-400">
                <Star className="w-3 h-3 fill-yellow-400" /> {avgRating} ({reviews.length})
              </span>
            )}
            {user?.identity_verified && (
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified
              </Badge>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border sticky top-[calc(3.5rem+56px)] z-10 bg-background/90 backdrop-blur-sm">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="px-4 py-4">

          {/* Jobs Posted Tab */}
          {activeTab === 'Jobs Posted' && (
            <div className="space-y-3">
              {jobPosts.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Briefcase className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="font-semibold">No jobs posted yet</p>
                  <Link to="/PostJob">
                    <Button size="sm" className="mt-2">Post a Job</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground font-medium mb-2">{jobPosts.length} Jobs</p>
                  {jobPosts.map(job => (
                    <Link key={job.id} to={`/JobDetail?id=${job.id}`}>
                      <div className="bg-card border border-border rounded-2xl p-4 hover:border-primary/20 transition-colors mb-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-sm leading-tight flex-1">{job.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                            job.status === 'open' ? 'bg-green-500/10 text-green-400'
                            : job.status === 'completed' ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-muted text-muted-foreground'
                          }`}>{job.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
                          {job.scheduled_date && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              {new Date(job.scheduled_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                          {job.duration_value && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {job.duration_value} {job.duration_value === 1 ? 'hour' : 'hours'}
                            </span>
                          )}
                          {!job.scheduled_date && job.flexible_dates && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" /> Flexible dates
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{job.category}</span>
                          {job.budget_min && (
                            <span className="font-semibold text-primary">
                              ${job.budget_min}<span className="font-normal text-muted-foreground">{job.duration_type === 'hourly' ? '/hr' : ' total'}</span>
                            </span>
                          )}
                        </div>
                        {job.application_count > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">{job.application_count} application{job.application_count !== 1 ? 's' : ''}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'Reviews' && (
            <div>
              {reviews.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <Star className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="font-semibold">No reviews yet</p>
                </div>
              ) : (
                <>
                  <div className="text-center py-6 border-b border-border mb-4">
                    <p className="text-6xl font-bold">{avgRating}</p>
                    <div className="flex items-center justify-center gap-0.5 my-2">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-sm">({reviews.length} reviews)</p>
                  </div>
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="border-b border-border pb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                            {review.reviewer_name?.[0] || 'R'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold">{review.reviewer_name || 'Anonymous'}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(review.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 my-1">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                              ))}
                            </div>
                            {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'About' && (
            <div>
              <div className="flex justify-center mb-6">
                <div className="w-40 h-40 rounded-full border-4 border-border bg-primary/20 flex items-center justify-center text-5xl font-bold text-primary overflow-hidden">
                  {profilePicUrl
                    ? <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                    : (user?.full_name?.[0] || 'U')}
                </div>
              </div>
              <h2 className="text-xl font-bold mb-3">{user?.display_name || user?.full_name}</h2>
              {user?.bio
                ? <p className="text-sm text-muted-foreground leading-relaxed mb-5 whitespace-pre-line">{user.bio}</p>
                : <p className="text-sm text-muted-foreground mb-5 italic">No bio yet.</p>}
              {user?.city && (
                <div className="flex items-center gap-3 text-sm mb-3">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>{user.city}</span>
                </div>
              )}
              <Link to="/UserProfileEdit">
                <Button variant="outline" className="w-full mt-4 border-border">
                  <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                </Button>
              </Link>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}