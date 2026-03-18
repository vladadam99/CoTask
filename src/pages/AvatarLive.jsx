import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import CameraStudio from '@/components/live/CameraStudio';
import {
  Home, Inbox, Calendar, Radio, MessageSquare, DollarSign,
  Star, User, Settings, Play, Square, Clock, ArrowLeft
} from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', path: '/AvatarDashboard' },
  { icon: Inbox, label: 'Requests', path: '/AvatarRequests' },
  { icon: Calendar, label: 'Schedule', path: '/AvatarSchedule' },
  { icon: Radio, label: 'Live', path: '/AvatarLive' },
  { icon: MessageSquare, label: 'Messages', path: '/Messages' },
  { icon: DollarSign, label: 'Earnings', path: '/AvatarEarnings' },
  { icon: Star, label: 'Reviews', path: '/AvatarReviews' },
  { icon: User, label: 'Profile', path: '/AvatarProfileEdit' },
  { icon: Settings, label: 'Settings', path: '/AvatarSettings' },
];

export default function AvatarLive() {
  const { user, loading } = useCurrentUser();
  const queryClient = useQueryClient();
  const [studioSession, setStudioSession] = useState(null); // the live session currently in studio

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

  const startSession = useMutation({
    mutationFn: (booking) => base44.entities.LiveSession.create({
      booking_id: booking.id,
      avatar_email: user.email,
      avatar_name: user.full_name,
      client_email: booking.client_email,
      client_name: booking.client_name,
      category: booking.category,
      title: `${booking.category} session`,
      status: 'live',
      started_at: new Date().toISOString(),
    }),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['avatar-live-sessions'] });
      setStudioSession(session);
    },
  });

  const endSession = useMutation({
    mutationFn: (sessionId) => base44.entities.LiveSession.update(sessionId, {
      status: 'ended',
      ended_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatar-live-sessions'] });
      setStudioSession(null);
    },
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const liveSession = studioSession || sessions.find(s => s.status === 'live');
  const pastSessions = sessions.filter(s => s.status === 'ended');

  // ── Studio view ────────────────────────────────────────────────────────────
  if (studioSession) {
    return (
      <AppShell navItems={navItems} user={user}>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setStudioSession(null)}
            className="glass rounded-lg p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{studioSession.title || 'Live Session'}</h1>
            <p className="text-xs text-muted-foreground">Client: {studioSession.client_name}</p>
          </div>
        </div>

        <CameraStudio
          sessionTitle={studioSession.title}
          onEnd={() => endSession.mutate(studioSession.id)}
        />
      </AppShell>
    );
  }

  // ── Dashboard view ─────────────────────────────────────────────────────────
  return (
    <AppShell navItems={navItems} user={user}>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1">Live Sessions</h1>
        <p className="text-muted-foreground text-sm">Manage and broadcast your live avatar sessions</p>
      </div>

      {/* Active session resumed from DB */}
      {liveSession && !studioSession && (
        <GlassCard className="p-6 mb-8 border border-red-500/30 glow-primary">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-semibold text-sm uppercase tracking-wide">Session Active</span>
          </div>
          <h2 className="text-xl font-bold mb-1">{liveSession.title}</h2>
          <p className="text-muted-foreground text-sm mb-4">With {liveSession.client_name}</p>
          <div className="flex gap-2">
            <Button
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => setStudioSession(liveSession)}
            >
              <Radio className="w-4 h-4" /> Open Studio
            </Button>
            <Button
              variant="destructive"
              onClick={() => endSession.mutate(liveSession.id)}
              disabled={endSession.isPending}
              className="gap-2"
            >
              <Square className="w-4 h-4" /> End Session
            </Button>
          </div>
        </GlassCard>
      )}

      {!liveSession && (
        <GlassCard className="p-6 mb-8 text-center border border-dashed border-white/10">
          <Radio className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No active session</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Start a session below to open the camera studio</p>
        </GlassCard>
      )}

      {/* Ready to Start */}
      {readyBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Ready to Start</h2>
          <div className="space-y-3">
            {readyBookings.map(b => (
              <GlassCard key={b.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{b.category}</p>
                  <p className="text-xs text-muted-foreground mt-1">{b.client_name} · {b.scheduled_date || 'Immediate'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary font-semibold text-sm">${b.total_amount || b.amount || 0}</span>
                  <Button
                    size="sm"
                    className="gap-1 bg-green-600 hover:bg-green-700"
                    onClick={() => startSession.mutate(b)}
                    disabled={startSession.isPending || !!liveSession}
                  >
                    <Play className="w-3 h-3" /> Start
                  </Button>
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