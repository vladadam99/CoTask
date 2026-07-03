import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, Clock, Users, Briefcase, Calendar, AlertCircle } from 'lucide-react';
import SmartSearchBar from '@/components/search/SmartSearchBar';
import { PageHero } from '@/components/ui/PagePrimitives';

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

  const activeRole = user?.selected_role || user?.role || 'user';
  const canPost = activeRole === 'user' || activeRole === 'enterprise';
  const canApply = activeRole === 'avatar' || activeRole === 'enterprise';

  return (
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
      <div className="space-y-6">
        <PageHero
          eyebrow="Marketplace"
          title="Task Board"
          description={canApply ? 'Browse open work, filter by category, and open the details before sending a proposal.' : 'Create open tasks, compare proposals, and find the right Local Agent.'}
          icon={Briefcase}
          actions={canPost && (
            <Link to="/PostJob">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" /> New Brief
              </Button>
            </Link>
          )}
          stats={[
            { label: 'Showing', value: isLoading ? '...' : sortedFiltered.length },
            { label: 'Status', value: showOpen ? 'Open' : 'All' },
            { label: 'Category', value: category },
          ]}
        />

        {/* Search + Filter bar */}
        <div className="surface-panel rounded-lg p-4 md:p-5 space-y-4">
          <SmartSearchBar
            items={jobs}
            itemSummaryFn={jobSummaryFn}
            onResults={setAiMatchedIds}
            placeholder="Search tasks, skills... (AI-powered)"
            suggestions={CATEGORIES.filter(c => c !== 'All')}
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  cat === category ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowOpen(true)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${showOpen ? 'bg-green-500/10 text-green-700 border-green-500/20' : 'bg-card text-muted-foreground border-border hover:text-foreground'}`}>
              Open Tasks
            </button>
            <button onClick={() => setShowOpen(false)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${!showOpen ? 'bg-card text-foreground border-primary/30' : 'bg-card text-muted-foreground border-border hover:text-foreground'}`}>
              All Tasks
            </button>
          </div>
        </div>

        {/* Job Count */}
        <p className="text-sm text-muted-foreground">{isLoading ? 'Loading...' : `${sortedFiltered.length} task${sortedFiltered.length !== 1 ? 's' : ''} found`}</p>

        {/* Job Cards */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="surface-panel rounded-lg p-5 animate-pulse h-28" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="surface-panel rounded-lg p-10 md:p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No tasks found</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">Check back later or adjust your filters.</p>
            {canPost && (
              <Link to="/PostJob" className="inline-block mt-4">
                <Button size="sm">New Brief</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedFiltered.map(job => (
              <Link key={job.id} to={`/JobDetail?id=${job.id}`}>
                <div className="surface-panel rounded-lg p-5 md:p-6 space-y-4 transition-all hover:border-primary/30">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-base">{job.title}</h3>
                        <Badge variant="outline" className={`text-xs border ${job.status === 'open' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-muted text-muted-foreground'}`}>
                          {job.status}
                        </Badge>
                        {job.camera_required && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">Camera proof</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Posted by {job.posted_by_name}</p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-secondary border-border text-muted-foreground flex-shrink-0">
                      <Users className="w-3 h-3 mr-1" />{job.application_count || 0} proposal{job.application_count !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{job.description}</p>

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {job.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{job.location}</span>}
                    {job.duration_value && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{job.duration_value} {job.duration_value === 1 ? 'hour' : 'hours'}</span>}
                    {job.budget_min && (
                      <span className="text-primary font-semibold">
                        ${job.budget_min}{DURATION_LABELS[job.duration_type]}{job.negotiable ? ' - negotiable' : ''}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {job.remote_ok && <span className="px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">Remote OK</span>}
                    {job.travel_required && <span className="px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">Travel Required</span>}
                    {job.flexible_dates
                      ? <span className="px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">Flexible Dates</span>
                      : job.scheduled_date && (
                        <span className="px-2 py-1 rounded-full bg-secondary border border-border text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {job.scheduled_date}{job.scheduled_time ? ` at ${job.scheduled_time}` : ''}
                        </span>
                      )}
                    {!job.flexible_dates && job.scheduled_date && job.scheduled_time && job.status === 'open' && (
                      <span className="px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3" /> Expires if unclaimed by {job.scheduled_time}
                      </span>
                    )}
                  </div>

                  {/* Skills */}
                  {(job.skills_required || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills_required.slice(0, 5).map(s => (
                        <span key={s} className="text-xs bg-secondary border border-border rounded-full px-2.5 py-1">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

