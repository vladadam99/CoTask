import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getNavItems } from '@/lib/navItems';
import {
  Inbox, Calendar, Clock, CheckCircle, XCircle, Eye, MapPin, Briefcase, ChevronRight, AlertCircle
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const TABS = [
  { key: 'Requests', label: 'Requests', icon: Clock },
  { key: 'Proposals', label: 'Proposals', icon: Briefcase },
  { key: 'Accepted', label: 'Accepted', icon: CheckCircle },
  { key: 'Completed', label: 'Completed', icon: CheckCircle },
  { key: 'Issues', label: 'Issues', icon: AlertCircle },
];

export default function AvatarRequests() {
  const { user, loading: userLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('accepted');
  const [declineModal, setDeclineModal] = useState(null); // { bookingId, clientEmail, category }
  const [declineReason, setDeclineReason] = useState('');

  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['avatar-all-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ avatar_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const { data: allOffers = [] } = useQuery({
    queryKey: ['avatar-counter-offers', user?.email],
    queryFn: async () => {
      if (!bookings.length) return [];
      const results = await base44.entities.CounterOffer.list('-created_date', 300);
      return results.filter(o => bookings.some(b => b.id === o.booking_id));
    },
    enabled: bookings.length > 0,
    refetchInterval: 15000,
  });

  const getLatestOffer = (bookingId) => allOffers.find(o => o.booking_id === bookingId);

  const { data: jobApps = [], isLoading: isLoadingApps } = useQuery({
    queryKey: ['avatar-job-apps', user?.email],
    queryFn: () => base44.entities.JobApplication.filter({ applicant_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  const { data: jobPosts = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['avatar-job-posts', user?.email],
    queryFn: async () => {
      const postsWhereWinner = await base44.entities.JobPost.filter({ winner_email: user.email }, '-updated_date', 50);
      const appJobIds = jobApps.map(a => a.job_id).filter(id => !postsWhereWinner.some(p => p.id === id));
      const postsForApps = [];
      for (const id of appJobIds) {
        const post = await base44.entities.JobPost.filter({ id }).then(r => r[0]);
        if (post) postsForApps.push(post);
      }
      return [...postsWhereWinner, ...postsForApps];
    },
    enabled: !!user && !isLoadingApps,
  });

  const isLoading = isLoadingBookings || isLoadingApps || isLoadingJobs;

  const allWorkItems = useMemo(() => {
    const arr = [];
    bookings.forEach(b => {
      let nextAction = 'View Task';
      if (b.status === 'pending') nextAction = 'Waiting for Local Agent';
      else if (['accepted', 'scheduled', 'in_progress', 'live'].includes(b.status)) nextAction = 'View Task';
      else if (b.status === 'completed') nextAction = 'View Earnings';
      else if (b.status === 'disputed') nextAction = 'View Dispute';
      else if (['declined', 'cancelled'].includes(b.status)) nextAction = 'View Details';

      const latestOffer = getLatestOffer(b.id);
      const displayAmount = latestOffer?.status === 'pending' ? latestOffer.amount : (b.total_amount || b.amount || 0);

      arr.push({
        type: 'direct_hire',
        id: b.id,
        title: `${b.category}${b.service_type ? ` - ${b.service_type}` : ''}`,
        status: b.status,
        payment_status: b.payment_status,
        date: b.scheduled_date || 'Immediate',
        time: b.scheduled_time || '',
        location: b.location,
        counterpart: b.client_name,
        amount: typeof displayAmount === 'number' ? `$${displayAmount.toFixed(2)}` : `$${displayAmount}`,
        route: `/AvatarBookingDetail?id=${b.id}`,
        nextAction,
        rawDate: b.created_date,
        originalObj: b
      });
    });

    jobApps.forEach(app => {
      const job = jobPosts.find(p => p.id === app.job_id);
      if (!job) return;

      let nextAction = 'View Task';
      if (app.status === 'pending') nextAction = 'Waiting for Client';
      else if (app.status === 'rejected') nextAction = 'Proposal Not Selected';
      else if (app.status === 'withdrawn') nextAction = 'Withdrawn';

      const isWon = job.winner_email === user?.email && app.status === 'accepted';
      const effectiveType = isWon ? 'won_open_task' : 'open_task_proposal';
      
      const effectiveStatus = isWon ? job.status : app.status;

      const paymentStatus = job.payment_status || (job.escrow_status === 'authorized' ? 'held' : job.escrow_status === 'captured' ? 'released' : 'pending');

      if (isWon) {
        if (['in_progress', 'open'].includes(job.status)) nextAction = 'View Task';
        else if (job.status === 'completed') nextAction = 'View Earnings';
        else if (job.status === 'disputed') nextAction = 'View Dispute';
      }

      arr.push({
        type: effectiveType,
        id: app.id,
        job_id: job.id,
        title: job.title,
        status: effectiveStatus,
        payment_status: paymentStatus,
        date: job.flexible_dates ? 'Flexible Dates' : (job.scheduled_date || 'TBD'),
        time: job.scheduled_time || '',
        location: job.location,
        counterpart: job.posted_by_name,
        amount: app.proposed_rate ? `$${app.proposed_rate}` : `$${job.budget_max || job.budget_min || 0}`,
        route: `/JobDetail?id=${job.id}`,
        nextAction,
        rawDate: app.created_date,
        originalObj: app
      });
    });

    return arr.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
  }, [bookings, jobApps, jobPosts, allOffers, user?.email]);

  const updateBooking = useMutation({
    mutationFn: async ({ id, status, reason }) => {
      const env = new URLSearchParams(window.location.search).get('base44_data_env') || localStorage.getItem('base44_base44_data_env');
      const res = await base44.functions.invoke('updateBookingStatus', { id, status, reason, env });
      if (res.data?.error) {
        throw new Error(res.data.error);
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatar-all-bookings'] });
      toast({ title: 'Success', description: 'Booking updated successfully.' });
    },
    onError: (err) => {
      console.error(err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  const handleDeclineClick = (booking) => {
    setDeclineReason('');
    setDeclineModal({ bookingId: booking.id, clientEmail: booking.client_email, category: booking.category });
  };

  const handleDeclineConfirm = () => {
    if (!declineReason.trim()) return;
    updateBooking.mutate({ id: declineModal.bookingId, status: 'declined', reason: declineReason.trim() });
    setDeclineModal(null);
  };

  if (userLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const filtered = allWorkItems.filter(t => {
    if (activeTab === 'Requests') return t.type === 'direct_hire' && t.status === 'pending';
    if (activeTab === 'Proposals') return t.type === 'open_task_proposal';
    if (activeTab === 'Accepted') return (t.type === 'direct_hire' && ['accepted', 'scheduled', 'in_progress', 'live'].includes(t.status)) || (t.type === 'won_open_task' && ['open', 'in_progress'].includes(t.status));
    if (activeTab === 'Completed') return t.status === 'completed';
    if (activeTab === 'Issues') return ['disputed', 'cancelled', 'declined', 'rejected', 'withdrawn'].includes(t.status);
    return false;
  });

  const pendingCount = allWorkItems.filter(t => t.type === 'direct_hire' && t.status === 'pending').length;

  return (
    <AppShell navItems={getNavItems(user?.selected_role)} user={user}>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1">My Schedule</h1>
        <p className="text-muted-foreground text-sm">
          Manage requests, proposals, and accepted tasks.
          {pendingCount > 0 ? ` You have ${pendingCount} pending request${pendingCount > 1 ? 's' : ''}.` : ''}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.key === 'pending' && pendingCount > 0 && (
              <span className="ml-1 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <GlassCard key={i} className="p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </GlassCard>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">No tasks found</h3>
          <p className="text-sm text-muted-foreground mb-4">No {activeTab.toLowerCase()} found for this filter.</p>
          <Link to="/JobMarketplace">
            <Button size="sm" variant="outline">Browse Task Board</Button>
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <Link key={`${task.type}-${task.id}`} to={task.route}>
              <GlassCard className="p-5" hover>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm">{task.title}</span>
                      <Badge variant="outline" className={`text-xs border ${task.type === 'direct_hire' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {task.type === 'direct_hire' ? 'Direct Hire' : 'Open Task'}
                      </Badge>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      <span className="font-medium text-foreground">{task.counterpart}</span>
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
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

                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <span className="text-lg font-bold text-primary">{task.amount}</span>
                    <div className="flex items-center gap-1.5 text-primary text-sm font-medium group">
                      {task.nextAction}
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                    {task.type === 'direct_hire' && task.status === 'pending' && (
                      <div className="flex gap-2 mt-2" onClick={(e) => e.preventDefault()}>
                        <Button
                          size="sm"
                          className="h-8 gap-1 bg-green-600 hover:bg-green-700"
                          onClick={() => updateBooking.mutate({ id: task.id, status: 'accepted' })}
                          disabled={updateBooking.isPending}
                        >
                          <CheckCircle className="w-3 h-3" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 gap-1"
                          onClick={() => handleDeclineClick(task.originalObj)}
                          disabled={updateBooking.isPending}
                        >
                          <XCircle className="w-3 h-3" /> Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
      {/* Decline Reason Modal */}
      <Dialog open={!!declineModal} onOpenChange={(open) => !open && setDeclineModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason for Declining</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Please provide a reason — this will be sent to the client.</p>
          <Textarea
            placeholder="e.g. I'm unavailable on that date, schedule conflict..."
            value={declineReason}
            onChange={e => setDeclineReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineModal(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeclineConfirm}
              disabled={!declineReason.trim() || updateBooking.isPending}
            >
              Decline Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}