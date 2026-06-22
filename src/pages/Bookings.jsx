import React, { useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, ArrowLeft, Briefcase, Users, Clock, ChevronRight, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';

const TABS = ['All', 'Active', 'Waiting', 'Completed', 'Issues'];

export default function Bookings() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');

  const isAvatar = user?.selected_role === 'avatar' || user?.role === 'avatar';
  const isClient = !isAvatar;

  const dashPath = user?.role === 'enterprise' ? '/EnterpriseDashboard' : '/UserDashboard';

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['all-bookings', user?.email, isAvatar],
    queryFn: () => {
      const filter = isAvatar ? { avatar_email: user.email } : { client_email: user.email };
      return base44.entities.Booking.filter(filter, '-created_date', 50);
    },
    enabled: !!user,
  });

  const clientBookings = isClient ? bookings : [];

  const { data: myJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['my-jobs', user?.email],
    queryFn: () => base44.entities.JobPost.filter({ posted_by_email: user.email }, '-created_date', 50),
    enabled: !!user && isClient,
  });

  const { data: allApplications = [], isLoading: appsLoading } = useQuery({
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

  const isLoading = bookingsLoading || jobsLoading || appsLoading;

  // Normalize Tasks
  const allTasks = useMemo(() => {
    const arr = [];
    clientBookings.forEach(b => {
      let nextAction = 'View Task';
      if (b.status === 'pending') nextAction = 'Waiting for Local Agent';
      else if (b.status === 'accepted' && b.payment_status === 'pending') nextAction = 'Fund Secure Payment';
      else if (['accepted', 'scheduled', 'in_progress', 'live'].includes(b.status) && ['held', 'paid'].includes(b.payment_status)) nextAction = 'Join / Track Status';
      else if (b.status === 'awaiting_approval') nextAction = 'Review Work';
      else if (b.status === 'completed') nextAction = 'Leave Review';
      else if (b.status === 'disputed') nextAction = 'View Dispute';
      else if (['declined', 'cancelled'].includes(b.status)) nextAction = 'View Details';

      arr.push({
        type: 'direct_hire',
        id: b.id,
        title: `${b.category}${b.service_type ? ` - ${b.service_type}` : ''}`,
        status: b.status,
        payment_status: b.payment_status,
        date: b.scheduled_date || 'Immediate',
        time: b.scheduled_time || '',
        location: b.location,
        counterpart: b.avatar_name,
        amount: typeof b.total_amount === 'number' ? `$${b.total_amount}` : `$${b.amount || 0}`,
        route: `/UserBookingDetail?id=${b.id}`,
        nextAction,
        rawDate: b.created_date
      });
    });

    myJobs.forEach(job => {
      const jobApps = allApplications.filter(a => a.job_id === job.id);
      const pendingApps = jobApps.filter(a => a.status === 'pending');
      const acceptedApp = jobApps.find(a => a.status === 'accepted');
      
      const paymentStatus = job.payment_status || (job.escrow_status === 'authorized' ? 'held' : job.escrow_status === 'captured' ? 'released' : 'pending');

      let nextAction = 'View Task';
      if (job.status === 'open' && pendingApps.length > 0) nextAction = 'Review Proposals';
      else if (job.status === 'open') nextAction = 'Waiting for Proposals';
      else if (job.status === 'in_progress' && paymentStatus === 'pending') nextAction = 'Fund Secure Payment';
      else if (job.status === 'in_progress') nextAction = 'Track Status / Join Live';
      else if (job.status === 'awaiting_approval') nextAction = 'Review Work';
      else if (job.status === 'completed') nextAction = 'View Receipt / Review';
      else if (job.status === 'disputed') nextAction = 'View Dispute';
      
      arr.push({
        type: 'open_task',
        id: job.id,
        title: job.title,
        status: job.status,
        payment_status: paymentStatus,
        date: job.flexible_dates ? 'Flexible Dates' : (job.scheduled_date || 'TBD'),
        time: job.scheduled_time || '',
        location: job.location,
        counterpart: acceptedApp?.applicant_name || null,
        proposalCount: pendingApps.length,
        amount: job.budget_min ? `$${job.budget_min}${job.budget_max ? `–$${job.budget_max}` : '+'}` : '',
        route: `/JobDetail?id=${job.id}`,
        nextAction,
        rawDate: job.created_date,
        jobApps
      });
    });
    
    return arr.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
  }, [clientBookings, myJobs, allApplications]);

  const filteredTasks = allTasks.filter(t => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.counterpart?.toLowerCase().includes(search.toLowerCase());
    
    let matchTab = true;
    if (tab === 'Active') matchTab = ['accepted', 'scheduled', 'in_progress', 'live', 'awaiting_approval'].includes(t.status);
    if (tab === 'Waiting') matchTab = ['open', 'pending'].includes(t.status);
    if (tab === 'Completed') matchTab = t.status === 'completed';
    if (tab === 'Issues') matchTab = ['disputed', 'cancelled', 'declined'].includes(t.status);
    
    return matchSearch && matchTab;
  });

  if (isAvatar) {
    return <Navigate to="/AvatarRequests" replace />;
  }

  return (
    <AppShell navItems={getNavItems(user?.selected_role)} user={user}>
      <div className="max-w-3xl mx-auto">
        <Link to={dashPath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="pl-10 bg-muted/50 border-border" />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                t === tab ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}>{t}</button>
          ))}
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">My Tasks</h1>
          <p className="text-sm text-muted-foreground mb-6">Track your Direct Hire requests and Open Tasks in one place.</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="glass rounded-xl p-5 animate-pulse"><div className="h-4 bg-muted rounded w-1/2 mb-2" /><div className="h-3 bg-muted rounded w-1/3" /></div>)}
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map(task => (
              <Link key={`${task.type}-${task.id}`} to={task.route}>
                <GlassCard className="p-5" hover>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold">{task.title}</p>
                        <Badge variant="outline" className={`text-xs border ${task.type === 'direct_hire' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                          {task.type === 'direct_hire' ? 'Direct Hire' : 'Open Task'}
                        </Badge>
                        <StatusBadge status={task.status} />
                      </div>
                      
                      <div className="flex flex-col gap-1 mt-2">
                        {task.counterpart && <p className="text-sm text-muted-foreground">Local Agent: <span className="font-medium text-foreground">{task.counterpart}</span></p>}
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                          {task.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {task.date} {task.time && `at ${task.time}`}
                            </span>
                          )}
                          {task.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {task.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <span className="text-lg font-bold text-primary">{task.amount}</span>
                      
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1.5 text-primary text-sm font-medium group">
                          {task.nextAction}
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                        
                        {task.type === 'open_task' && task.proposalCount > 0 && !task.counterpart && (
                          <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-medium mt-1">
                            <Users className="w-3.5 h-3.5" /> {task.proposalCount} pending proposals
                          </div>
                        )}
                        {task.type === 'direct_hire' && task.status === 'pending' && (
                          <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-medium mt-1">
                            <Clock className="w-3.5 h-3.5" /> Awaiting response
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        ) : (
          <GlassCard className="p-12 text-center flex flex-col items-center justify-center border border-dashed border-border/60 bg-transparent shadow-none">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No tasks yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">Request a Local Agent or post an Open Task to get started.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-md">
              <Link to="/PostJob" className="flex-1 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-center">
                Post Open Task
              </Link>
              <Link to="/FindPeople" className="flex-1 px-6 py-2.5 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors text-center">
                Discover Local Agents
              </Link>
            </div>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}