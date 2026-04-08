import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MapPin, Clock, DollarSign, Users, Filter, Briefcase } from 'lucide-react';
import SmartSearchBar from '@/components/search/SmartSearchBar';

const CATEGORIES = ['All', 'Shopping', 'Delivery', 'Real Estate', 'Tourism', 'Events', 'Inspection', 'Translation', 'Other'];
const DURATION_LABELS = { hourly: '/hr', daily: '/day', weekly: '/wk', monthly: '/mo', custom: '' };

export default function JobMarketplace() {
  const { user } = useCurrentUser();
  const [aiMatchedIds, setAiMatchedIds] = useState(null);
  const [category, setCategory] = useState('All');
  const [showOpen, setShowOpen] = useState(true);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['job-posts', showOpen],
    queryFn: () => base44.entities.JobPost.filter(showOpen ? { status: 'open' } : {}, '-created_date', 50),
  });

  const jobSummaryFn = (j) => [
    j.title, j.description, j.category, j.location,
    (j.skills_required || []).join(', '),
    (j.languages_required || []).join(', '),
  ].filter(Boolean).join(' | ');

  const filtered = jobs.filter(j => {
    if (aiMatchedIds !== null && !aiMatchedIds.includes(j.id)) return false;
    const matchCat = category === 'All' || j.category === category;
    return matchCat;
  });

  const sortedFiltered = aiMatchedIds
    ? [...filtered].sort((a, b) => aiMatchedIds.indexOf(a.id) - aiMatchedIds.indexOf(b.id))
    : filtered;

  const canPost = user?.role === 'user' || user?.role === 'enterprise';
  const canApply = user?.role === 'avatar' || user?.role === 'enterprise';

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Job Marketplace</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {canApply ? 'Browse and apply for jobs posted by clients' : 'Post jobs and find the perfect avatar'}
            </p>
          </div>
          {canPost && (
            <Link to="/PostJob">
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Post a Job
              </Button>
            </Link>
          )}
        </div>

        {/* Search + Filter bar */}
        <div className="glass rounded-2xl p-4 space-y-3">
          <SmartSearchBar
            items={jobs}
            itemSummaryFn={jobSummaryFn}
            onResults={setAiMatchedIds}
            placeholder="Search jobs, tasks, skills... (AI-powered)"
            suggestions={CATEGORIES.filter(c => c !== 'All')}
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  cat === category ? 'bg-primary text-white' : 'bg-white/5 border border-white/10 text-muted-foreground hover:border-primary/30'
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowOpen(true)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all ${showOpen ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-white/5 text-muted-foreground border border-white/10'}`}>
              Open Jobs
            </button>
            <button onClick={() => setShowOpen(false)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all ${!showOpen ? 'bg-white/20 text-foreground border border-white/20' : 'bg-white/5 text-muted-foreground border border-white/10'}`}>
              All Jobs
            </button>
          </div>
        </div>

        {/* Job Count */}
        <p className="text-sm text-muted-foreground">{isLoading ? 'Loading...' : `${sortedFiltered.length} job${sortedFiltered.length !== 1 ? 's' : ''} found`}</p>

        {/* Job Cards */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="glass rounded-2xl p-5 animate-pulse h-28 border border-white/5" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center border border-white/5">
            <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold mb-1">No jobs found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or check back later</p>
            {canPost && (
              <Link to="/PostJob" className="inline-block mt-4">
                <Button size="sm">Post the first job</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedFiltered.map(job => (
              <Link key={job.id} to={`/JobDetail?id=${job.id}`}>
                <div className="glass border border-white/5 hover:border-primary/30 rounded-2xl p-5 transition-all hover:scale-[1.005]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm">{job.title}</h3>
                        <Badge variant="outline" className={`text-xs border ${job.status === 'open' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-muted text-muted-foreground'}`}>
                          {job.status}
                        </Badge>
                        {job.camera_required && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">📷 Camera</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{job.description}</p>
                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                        {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.duration_value} {job.duration_type}</span>
                        {job.budget_min && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${job.budget_min}{job.budget_max ? `–$${job.budget_max}` : '+'}{DURATION_LABELS[job.duration_type]}</span>}
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{job.application_count || 0} applicant{job.application_count !== 1 ? 's' : ''}</span>
                      </div>
                      {(job.skills_required || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.skills_required.slice(0, 4).map(s => (
                            <span key={s} className="text-xs bg-white/5 border border-white/5 rounded px-2 py-0.5">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">{job.posted_by_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{job.posted_by_type}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}