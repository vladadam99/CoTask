import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import StatusBadge from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { EmptyState, ToolbarPanel } from '@/components/ui/PagePrimitives';

const TABS = ['All', 'Needs Action', 'Active', 'Waiting', 'Completed', 'Issues'];

function formatTaskAmount(value) {
  return value || 'Budget TBD';
}

function needsClientAction(task) {
  return ['Fund Secure Payment', 'Review Proposals', 'Review Work', 'View Receipt / Review', 'Leave Review'].includes(task.nextAction);
}

function typeMeta(type) {
  if (type === 'direct_hire') {
    return {
      label: 'Direct Hire',
      className: 'border-primary/20 bg-primary/10 text-primary',
    };
  }
  return {
    label: 'Open Task',
    className: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  };
}

function actionTone(task) {
  if (needsClientAction(task)) return 'border-primary/20 bg-primary/10 text-primary';
  if (['open', 'pending'].includes(task.status)) return 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300';
  if (['completed'].includes(task.status)) return 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300';
  if (['disputed', 'cancelled', 'declined'].includes(task.status)) return 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300';
  return 'border-border bg-secondary/70 text-muted-foreground';
}

function TaskCard({ task }) {
  const meta = typeMeta(task.type);

  return (
    <Link to={task.route} className="group block">
      <article className="record-card p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={`rounded-full text-xs font-bold ${meta.className}`}>
                {meta.label}
              </Badge>
              <StatusBadge status={task.status} />
              {task.payment_status && task.payment_status !== 'pending' && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/70 px-2.5 py-1 text-xs font-bold text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-primary" /> {task.payment_status}
                </span>
              )}
            </div>

            <h3 className="mt-3 text-lg font-black leading-snug text-foreground group-hover:text-primary">
              {task.title || 'Untitled task'}
            </h3>

            <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <span className="inline-flex min-w-0 items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{task.date || 'Date TBD'}{task.time ? ` at ${task.time}` : ''}</span>
              </span>
              <span className="inline-flex min-w-0 items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{task.location || 'Location TBD'}</span>
              </span>
              {task.counterpart && (
                <span className="inline-flex min-w-0 items-center gap-2 sm:col-span-2">
                  <Users className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">Local Agent: <strong className="font-bold text-foreground">{task.counterpart}</strong></span>
                </span>
              )}
              {task.type === 'open_task' && task.proposalCount > 0 && !task.counterpart && (
                <span className="inline-flex min-w-0 items-center gap-2 sm:col-span-2">
                  <Users className="h-4 w-4 shrink-0 text-amber-500" />
                  <strong className="font-bold text-amber-700 dark:text-amber-300">{task.proposalCount} proposal{task.proposalCount === 1 ? '' : 's'} waiting</strong>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 lg:w-56">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Amount</p>
              <p className="mt-1 text-xl font-black text-foreground">{formatTaskAmount(task.amount)}</p>
            </div>
            <div className={`rounded-lg border px-3 py-2 text-sm font-bold ${actionTone(task)}`}>
              <span className="flex items-center justify-between gap-2">
                {task.nextAction}
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function Bookings() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');

  const activeRole = user?.selected_role || user?.role || 'user';
  const shellRole = activeRole === 'avatar' ? 'user' : activeRole;
  const shellHomePath = shellRole === 'user' ? '/Explore' : undefined;
  const isEnterprise = shellRole === 'enterprise';

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['all-bookings', user?.email, 'client'],
    queryFn: () => base44.entities.Booking.filter({ client_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const { data: myJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['my-jobs', user?.email],
    queryFn: () => base44.entities.JobPost.filter({ posted_by_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const { data: allApplications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['my-job-applications', user?.email, myJobs.length],
    queryFn: async () => {
      const apps = [];
      for (const job of myJobs) {
        const jobApps = await base44.entities.JobApplication.filter({ job_id: job.id }, '-created_date', 50);
        apps.push(...jobApps);
      }
      return apps;
    },
    enabled: !!user && myJobs.length > 0,
  });

  const isLoading = bookingsLoading || jobsLoading || appsLoading;

  const allTasks = useMemo(() => {
    const arr = [];

    bookings.forEach((booking) => {
      let nextAction = 'View Task';
      if (booking.status === 'pending') nextAction = 'Waiting for Local Agent';
      else if (booking.status === 'accepted' && booking.payment_status === 'pending') nextAction = 'Fund Secure Payment';
      else if (['accepted', 'scheduled', 'in_progress', 'live'].includes(booking.status) && ['held', 'paid'].includes(booking.payment_status)) nextAction = 'Join / Track Status';
      else if (booking.status === 'awaiting_approval') nextAction = 'Review Work';
      else if (booking.status === 'completed') nextAction = 'Leave Review';
      else if (booking.status === 'disputed') nextAction = 'View Dispute';
      else if (['declined', 'cancelled'].includes(booking.status)) nextAction = 'View Details';

      arr.push({
        type: 'direct_hire',
        id: booking.id,
        title: `${booking.category || 'Direct Hire'}${booking.service_type ? ` - ${booking.service_type}` : ''}`,
        status: booking.status,
        payment_status: booking.payment_status,
        date: booking.scheduled_date || 'Immediate',
        time: booking.scheduled_time || '',
        location: booking.location,
        counterpart: booking.avatar_name,
        amount: typeof booking.total_amount === 'number' ? `$${booking.total_amount}` : `$${booking.amount || 0}`,
        route: `/UserBookingDetail?id=${booking.id}`,
        nextAction,
        rawDate: booking.created_date || booking.updated_date,
      });
    });

    myJobs.forEach((job) => {
      const jobApps = allApplications.filter((application) => application.job_id === job.id);
      const pendingApps = jobApps.filter((application) => application.status === 'pending');
      const acceptedApp = jobApps.find((application) => application.status === 'accepted');
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
        date: job.flexible_dates ? 'Flexible dates' : (job.scheduled_date || 'TBD'),
        time: job.scheduled_time || '',
        location: job.location,
        counterpart: acceptedApp?.applicant_name || null,
        proposalCount: pendingApps.length,
        amount: job.budget_min ? `$${job.budget_min}${job.budget_max ? `-$${job.budget_max}` : '+'}` : '',
        route: `/JobDetail?id=${job.id}`,
        nextAction,
        rawDate: job.created_date || job.updated_date,
      });
    });

    return arr.sort((a, b) => new Date(b.rawDate || 0) - new Date(a.rawDate || 0));
  }, [bookings, myJobs, allApplications]);

  const taskCounts = useMemo(() => {
    const active = allTasks.filter((task) => ['accepted', 'scheduled', 'in_progress', 'live', 'awaiting_approval'].includes(task.status)).length;
    const waiting = allTasks.filter((task) => ['open', 'pending'].includes(task.status)).length;
    const completed = allTasks.filter((task) => task.status === 'completed').length;
    const needsAction = allTasks.filter(needsClientAction).length;
    return { active, waiting, completed, needsAction };
  }, [allTasks]);

  const filteredTasks = allTasks.filter((task) => {
    const query = search.trim().toLowerCase();
    const matchSearch = !query ||
      task.title?.toLowerCase().includes(query) ||
      task.counterpart?.toLowerCase().includes(query) ||
      task.location?.toLowerCase().includes(query);

    let matchTab = true;
    if (tab === 'Needs Action') matchTab = needsClientAction(task);
    if (tab === 'Active') matchTab = ['accepted', 'scheduled', 'in_progress', 'live', 'awaiting_approval'].includes(task.status);
    if (tab === 'Waiting') matchTab = ['open', 'pending'].includes(task.status);
    if (tab === 'Completed') matchTab = task.status === 'completed';
    if (tab === 'Issues') matchTab = ['disputed', 'cancelled', 'declined'].includes(task.status);

    return matchSearch && matchTab;
  });

  const priorityTask = allTasks.find(needsClientAction) || allTasks[0];

  return (
    <AppShell navItems={getNavItems(shellRole)} user={user} roleOverride={shellRole} homePathOverride={shellHomePath}>
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="p-4 md:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                  <Briefcase className="h-3.5 w-3.5" /> Client workspace
                </span>
                {isEnterprise && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-3 py-1.5 text-xs font-bold text-muted-foreground">
                    Enterprise tasks
                  </span>
                )}
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground md:text-4xl">Workboard</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Track proposals, direct hires, Secure Payment, live sessions, proof review, and completed work in one focused place.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link to="/PostJob" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90">
                  <Plus className="h-4 w-4" /> New Task
                </Link>
                <Link to="/Explore" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-bold text-foreground hover:bg-secondary">
                  Browse Agents <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="border-t border-border bg-secondary/45 p-4 lg:border-l lg:border-t-0">
              {priorityTask ? (
                <Link to={priorityTask.route} className="block rounded-lg border border-border bg-card p-4 shadow-sm hover:border-primary/30">
                  <p className="section-label">Next action</p>
                  <h2 className="mt-2 line-clamp-2 text-lg font-black text-foreground">{priorityTask.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{priorityTask.nextAction}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">
                    Open task <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-card p-4">
                  <p className="section-label">Next action</p>
                  <h2 className="mt-2 text-lg font-black text-foreground">Start with a task</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Create a request or choose an agent to begin.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Needs action', value: taskCounts.needsAction, icon: AlertCircle, tone: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Active work', value: taskCounts.active, icon: Clock, tone: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-500/10' },
            { label: 'Waiting', value: taskCounts.waiting, icon: Users, tone: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10' },
            { label: 'Completed', value: taskCounts.completed, icon: CheckCircle2, tone: 'text-green-700 dark:text-green-300', bg: 'bg-green-500/10' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="surface-panel rounded-lg p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-2xl font-black text-foreground">{item.value}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bg} ${item.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <ToolbarPanel className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks, agents, locations..." className="h-12 rounded-lg border-input bg-card pl-10" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              {TABS.map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    item === tab
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </ToolbarPanel>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="surface-panel rounded-lg p-5 animate-pulse">
                <div className="mb-3 h-4 w-1/2 rounded bg-muted" />
                <div className="h-3 w-1/3 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="space-y-3">
            {filteredTasks.map((task) => <TaskCard key={`${task.type}-${task.id}`} task={task} />)}
          </div>
        ) : (
          <EmptyState
            icon={CreditCard}
            title={allTasks.length === 0 ? 'No work yet' : 'No work matches this view'}
            description={allTasks.length === 0 ? 'Create a task or request Direct Hire to start working with a Local Agent.' : 'Try another filter or search term.'}
            action={(
              <div className="flex w-full max-w-md flex-col justify-center gap-3 sm:flex-row">
                <Link to="/PostJob" className="flex-1 rounded-lg bg-primary px-6 py-2.5 text-center font-bold text-primary-foreground transition-colors hover:bg-primary/90">
                  New Task
                </Link>
                <Link to="/Explore" className="flex-1 rounded-lg border border-border bg-card px-6 py-2.5 text-center font-bold text-foreground transition-colors hover:bg-secondary">
                  Browse Agents
                </Link>
              </div>
            )}
          />
        )}
      </div>
    </AppShell>
  );
}

