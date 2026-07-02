import React from 'react';
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
  Radio, Square, Clock, Clapperboard, Film
} from 'lucide-react';



export default function AvatarLive() {
  const { user, loading } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: sessions = [] } = useQuery({
    queryKey: ['avatar-live-sessions', user?.email],
    queryFn: () => base44.entities.LiveSession.filter({ avatar_email: user.email }, '-created_date', 20),
    enabled: !!user,
  });

  const { data: readyBookings = [] } = useQuery({
    queryKey: ['avatar-ready-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ avatar_email: user.email, status: 'accepted' }, '-scheduled_date', 10),
    enabled: !!user,
  });

  const endSession = useMutation({
    mutationFn: async (session) => {
      await base44.functions.invoke('updateLiveSession', {
        id: session.id,
        updates: {
          status: 'ended',
          ended_at: new Date().toISOString(),
        }
      });
      // Complete the booking via backend to enforce permissions
      if (session.booking_id) {
        await base44.functions.invoke('updateBookingStatus', {
          id: session.booking_id,
          action: 'complete_session'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatar-live-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['reels-feed'] });
      queryClient.invalidateQueries({ queryKey: ['explore-recent-posts'] });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
    },
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const liveSession = sessions.find(s => s.status === 'live');
  const pastSessions = sessions.filter(s => s.status === 'ended');

  return (
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">Live Sessions</h1>
          <p className="text-muted-foreground text-sm">Manage private client sessions, public live streams, and recordings.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/RecordingLibrary">
            <Button variant="outline" className="gap-2">
              <Film className="w-4 h-4" /> Recordings
            </Button>
          </Link>
          <Link to="/LiveStreamStudio?mode=public">
            <Button variant="outline" className="gap-2">
              <Radio className="w-4 h-4" /> Public Live
            </Button>
          </Link>
          <Link to="/LiveStreamStudio">
            <Button className="gap-2">
              <Clapperboard className="w-4 h-4" /> Client Studio
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Session */}
      {liveSession ? (
        <GlassCard className="p-6 mb-8 border border-red-200 bg-red-50">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-semibold text-sm uppercase tracking-wide">Live Now</span>
          </div>
          <h2 className="text-xl font-bold mb-1">{liveSession.title}</h2>
          <p className="text-muted-foreground text-sm mb-4">Client: {liveSession.client_name}</p>
          <Button
            variant="destructive"
            onClick={() => endSession.mutate(liveSession)}
            disabled={endSession.isPending}
            className="gap-2"
          >
            <Square className="w-4 h-4" /> End Session
          </Button>
        </GlassCard>
      ) : (
        <GlassCard className="p-6 mb-8 text-center border border-dashed border-border">
          <Radio className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No active session</p>
        </GlassCard>
      )}

      {/* Ready to Start */}
      {readyBookings.length > 0 && (
        <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Ready for Studio</h2>
        <div className="space-y-3">
          {readyBookings.map(b => (
            <GlassCard key={b.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{b.category}</p>
                  <p className="text-xs text-muted-foreground mt-1">{b.client_name} - {b.scheduled_date || 'Immediate'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary font-semibold text-sm">${b.total_amount || b.amount || 0}</span>
                  <Link to="/LiveStreamStudio">
                    <Button
                      size="sm"
                      className="gap-1 bg-green-600 hover:bg-green-700"
                      disabled={!!liveSession}
                    >
                      <Clapperboard className="w-3 h-3" /> Open Studio
                    </Button>
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Past Sessions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Session History</h2>
        {pastSessions.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No completed sessions yet</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {pastSessions.map(s => (
              <GlassCard key={s.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.client_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  {s.duration_minutes && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {s.duration_minutes} min
                    </span>
                  )}
                  <StatusBadge status={s.status} />
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
