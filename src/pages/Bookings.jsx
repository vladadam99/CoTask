import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Calendar, Search, ArrowLeft, Briefcase, Users, Clock, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';

const TABS = ['All', 'Pending', 'Active', 'Completed', 'Cancelled'];

export default function Bookings() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

  const isAvatar = user?.role === 'avatar';
  const isClient = !isAvatar;

  const dashPath = isAvatar ? '/AvatarDashboard' : user?.role === 'enterprise' ? '/EnterpriseDashboard' : '/UserDashboard';

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['all-bookings', user?.email, isAvatar],
    queryFn: () => {
      const filter = isAvatar ? { avatar_email: user.email } : { client_email: user.email };
      return base44.entities.Booking.filter(filter, '-created_date', 50);
    },
    enabled: !!user,
  });

  const { data: myJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['my-jobs', user?.email],
    queryFn: () => base44.entities.JobPost.filter({ posted_by_email: user.email }, '-created_date', 50),
    enabled: !!user && isClient,
  });

  const { data: allApplications = [] } = useQuery({
    queryKey: ['my-job-applications', user?.email],
    queryFn: async () => {
      const apps = [];
      for (const job of myJobs) {
        const jobApps = await base44.entities.JobApplication.filter({ job_id: job.id }, '-created_date', 50);
        apps.push(...jobApps);
      }
      return apps;
    },
    enabled: !!user && isClient && myJobs.length > 0,
  });

  const filtered = bookings.filter(b => {
    const matchTab = tab === 'All' ||
      (tab === 'Pending' && b.status === 'pending') ||
      (tab === 'Active' && ['accepted', 'scheduled', 'in_progress', 'live'].includes(b.status)) ||
      (tab === 'Completed' && b.status === 'completed') ||
      (tab === 'Cancelled' && ['cancelled', 'declined'].includes(b.status));
    const matchSearch = !search || b.category?.toLowerCase().includes(search.toLowerCase()) ||
      (isAvatar ? b.client_name : b.avatar_name)?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="max-w-3xl mx-auto">
        <Link to={dashPath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>



        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{isClient ? 'My Job Posts' : 'Bookings'}</h1>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings..." className="pl-10 bg-muted/50 border-white/5" />
        </div>

        {isAvatar && (
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  t === tab ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}>{t}</button>
            ))}
          </div>
        )}

        {isClient ? (
          jobsLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="glass rounded-xl p-5 animate-pulse"><div className="h-4 bg-muted rounded w-1/2 mb-2" /><div className="h-3 bg-muted rounded w-1/3" /></div>)}
            </div>
          ) : myJobs.length > 0 ? (
            <div className="space-y-3">
              {myJobs.map(job => {
                const jobApps = allApplications.filter(a => a.job_id === job.id);
                const pendingApps = jobApps.filter(a => a.status === 'pending');
                const acceptedApp = jobApps.find(a => a.status === 'accepted');
                return (
                  <Link key={job.id} to={`/JobDetail?id=${job.id}`}>
                    <GlassCard className="p-5" hover>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold">{job.title}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${
                              job.status === 'open' ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : job.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-muted text-muted-foreground border-border'
                            }`}>{job.status.replace('_', ' ')}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{job.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{job.category}</span>
                            {job.budget_min && <span className="text-primary font-medium">${job.budget_min}{job.budget_max ? `–$${job.budget_max}` : '+'}</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {acceptedApp ? (
                            <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                              <CheckCircle className="w-4 h-4" /> Assigned
                            </div>
                          ) : pendingApps.length > 0 ? (
                            <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-medium">
                              <Users className="w-4 h-4" /> {pendingApps.length} pending
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                              <Clock className="w-4 h-4" /> No applicants
                            </div>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                );
              })}
            </div>
          ) : (
            <GlassCard className="p-10 text-center">
              <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No job posts yet</p>
              <Link to="/PostJob"><button className="mt-3 text-sm text-primary hover:underline">Post your first job →</button></Link>
            </GlassCard>
          )
        ) : viewMode === 'calendar' ? (
          <BookingCalendar bookings={bookings} />
        ) : isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="glass rounded-xl p-5 animate-pulse"><div className="h-4 bg-muted rounded w-1/2 mb-2" /><div className="h-3 bg-muted rounded w-1/3" /></div>)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(b => (
              <Link key={b.id} to={`/BookingDetail?id=${b.id}`}>
                <GlassCard className="p-5" hover>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{b.category}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isAvatar ? b.client_name : b.avatar_name} · {b.scheduled_date || 'Immediate'} {b.scheduled_time || ''}
                      </p>
                      {b.location && <p className="text-xs text-muted-foreground mt-1">{b.location}</p>}
                    </div>
                    <div className="text-right">
                      <StatusBadge status={b.status} />
                      <p className="text-sm font-medium mt-2">${b.total_amount || 0}</p>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        ) : (
          <GlassCard className="p-10 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No bookings match your filter</p>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}