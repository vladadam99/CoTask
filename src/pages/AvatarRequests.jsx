import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { getNavItems } from '@/lib/navItems';
import {
  Inbox, Calendar, Clock, CheckCircle, XCircle, Eye, MapPin, Briefcase
} from 'lucide-react';



const TABS = [
  { key: 'accepted', label: 'Accepted', icon: CheckCircle },
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'declined', label: 'Declined', icon: XCircle },
  { key: 'jobs', label: 'My Jobs', icon: Briefcase },
  { key: 'all', label: 'All', icon: Inbox },
];

export default function AvatarRequests() {
  const { user, loading: userLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('accepted');

  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['avatar-all-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ avatar_email: user.email }, '-created_date', 50),
    enabled: !!user,
  });

  // Fetch latest counter-offer per booking to show current negotiated price
  const { data: allOffers = [] } = useQuery({
    queryKey: ['avatar-counter-offers', user?.email],
    queryFn: async () => {
      if (!bookings.length) return [];
      const ids = bookings.map(b => b.id);
      const results = await Promise.all(
        ids.map(bid => base44.entities.CounterOffer.filter({ booking_id: bid }, '-created_date', 1).then(r => r[0] || null))
      );
      return results.filter(Boolean);
    },
    enabled: bookings.length > 0,
    refetchInterval: 8000,
  });

  const getLatestOffer = (bookingId) => allOffers.find(o => o.booking_id === bookingId);

  const { data: wonJobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['avatar-won-jobs', user?.email],
    queryFn: () => base44.entities.JobPost.filter({ winner_email: user.email }, '-updated_date', 50),
    enabled: !!user,
  });

  const isLoading = isLoadingBookings || isLoadingJobs;

  const updateBooking = useMutation({
    mutationFn: async ({ id, status }) => {
      await base44.entities.Booking.update(id, { status });
      const booking = bookings.find(b => b.id === id);
      if (status === 'accepted') {
        await base44.functions.invoke('createConversation', { bookingId: id });
        // Notify client
        if (booking?.client_email) {
          await base44.entities.Notification.create({
            user_email: booking.client_email,
            title: 'Booking Accepted!',
            message: `${user.full_name} accepted your ${booking.category} booking request.`,
            type: 'booking_accepted',
            link: `/UserBookingDetail?id=${id}`,
            reference_id: id,
            });
            }
      } else if (status === 'declined' && booking?.client_email) {
        await base44.entities.Notification.create({
          user_email: booking.client_email,
          title: 'Booking Declined',
          message: `${user.full_name} declined your ${booking.category} booking request.`,
          type: 'booking_declined',
          link: `/UserBookingDetail?id=${id}`,
          reference_id: id,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['avatar-all-bookings'] }),
  });

  if (userLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const filtered = activeTab === 'all'
    ? bookings
    : activeTab === 'jobs'
    ? wonJobs
    : bookings.filter(b => b.status === activeTab);

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1">Booking Requests</h1>
        <p className="text-muted-foreground text-sm">
          {pendingCount > 0 ? `You have ${pendingCount} pending request${pendingCount > 1 ? 's' : ''}` : 'No pending requests right now'}
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
        <GlassCard className="p-12 text-center">
          <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No {activeTab === 'jobs' ? 'won jobs' : activeTab === 'all' ? '' : activeTab} found</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {activeTab === 'jobs' ? wonJobs.map(job => (
            <GlassCard key={job.id} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">{job.title}</span>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Client: <span className="font-medium text-foreground">{job.posted_by_name}</span></p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                    {job.category && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.category}</span>}
                    {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                    {job.scheduled_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{job.scheduled_date}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <span className="text-lg font-bold text-primary">${job.escrow_amount || job.budget_max || 0}</span>
                  <Link to={`/JobDetail?id=${job.id}`}>
                    <Button size="sm" variant="outline" className="h-8 gap-1"><Eye className="w-3 h-3" /> View</Button>
                  </Link>
                </div>
              </div>
            </GlassCard>
          )) : filtered.map(booking => (
            <GlassCard key={booking.id} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">{booking.category}</span>
                    {booking.service_type && (
                      <span className="text-xs text-muted-foreground">· {booking.service_type}</span>
                    )}
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="font-medium text-foreground">{booking.client_name}</span>
                    {booking.client_type === 'enterprise' && (
                      <span className="ml-1 text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">Enterprise</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                    {booking.scheduled_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {booking.scheduled_date} {booking.scheduled_time && `at ${booking.scheduled_time}`}
                      </span>
                    )}
                    {booking.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {booking.location}
                      </span>
                    )}
                    {booking.duration_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {booking.duration_minutes} min
                      </span>
                    )}
                  </div>
                  {booking.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">"{booking.notes}"</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  {(() => {
                    const latestOffer = getLatestOffer(booking.id);
                    const displayAmount = latestOffer?.status === 'pending'
                      ? latestOffer.amount
                      : (booking.total_amount || booking.amount || 0);
                    return (
                      <div className="text-right">
                        <span className="text-lg font-bold text-primary">${typeof displayAmount === 'number' ? displayAmount.toFixed(2) : displayAmount}</span>
                        {latestOffer?.status === 'pending' && latestOffer.offered_by_role === 'client' && (
                          <p className="text-xs text-yellow-400 mt-0.5">Counter-offer pending</p>
                        )}
                      </div>
                    );
                  })()}
                  <div className="flex gap-2">
                    <Link to={`/AvatarBookingDetail?id=${booking.id}`}>
                      <Button size="sm" variant="outline" className="h-8 gap-1">
                        <Eye className="w-3 h-3" /> View
                      </Button>
                    </Link>
                    {booking.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="h-8 gap-1 bg-green-600 hover:bg-green-700"
                          onClick={() => updateBooking.mutate({ id: booking.id, status: 'accepted' })}
                          disabled={updateBooking.isPending}
                        >
                          <CheckCircle className="w-3 h-3" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 gap-1"
                          onClick={() => updateBooking.mutate({ id: booking.id, status: 'declined' })}
                          disabled={updateBooking.isPending}
                        >
                          <XCircle className="w-3 h-3" /> Decline
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}