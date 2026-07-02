import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Clock, MessageCircle, Square } from 'lucide-react';
import DailyVideoCall from '@/components/live/DailyVideoCall';
import SessionEndedScreen from '@/components/live/SessionEndedScreen';
import StreamChatbox from '@/components/live/StreamChatbox';

export default function ClientLiveView() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session');
  const bookingId = params.get('booking');
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const [elapsed, setElapsed] = useState(0);
  const [chatOpen, setChatOpen] = useState(true);
  const [ending, setEnding] = useState(false);
  const timerRef = useRef(null);

  const { data: session, isLoading } = useQuery({
    queryKey: ['client-live-session', sessionId, bookingId],
    queryFn: async () => {
      if (sessionId) {
        const list = await base44.entities.LiveSession.filter({ id: sessionId });
        return list[0] || null;
      }
      if (bookingId) {
        const list = await base44.entities.LiveSession.filter({ booking_id: bookingId });
        return list.find(s => s.status === 'live' || s.status === 'waiting') || list[0] || null;
      }
      return null;
    },
    enabled: !!(sessionId || bookingId),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!session?.id) return undefined;
    const unsubscribe = base44.entities.LiveSession.subscribe((event) => {
      if (event.id === session.id || event.data?.id === session.id) {
        queryClient.invalidateQueries({ queryKey: ['client-live-session', sessionId, bookingId] });
      }
    });
    return unsubscribe;
  }, [bookingId, queryClient, session?.id, sessionId]);

  useEffect(() => {
    if (session?.status !== 'live') {
      clearInterval(timerRef.current);
      return undefined;
    }

    const startedAt = session.started_at ? new Date(session.started_at).getTime() : Date.now();
    const updateElapsed = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };

    updateElapsed();
    timerRef.current = setInterval(updateElapsed, 1000);
    return () => clearInterval(timerRef.current);
  }, [session?.started_at, session?.status]);

  const handleEndSession = async () => {
    if (!session) return;
    setEnding(true);
    await base44.functions.invoke('updateLiveSession', {
      id: session.id,
      updates: {
        status: 'ended',
        ended_at: new Date().toISOString(),
        duration_minutes: Math.round(elapsed / 60),
      },
    });
    setEnding(false);
    queryClient.invalidateQueries({ queryKey: ['client-live-session', sessionId, bookingId] });
  };

  const fmt = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="p-10 text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Session Not Found</h2>
          <p className="text-sm text-muted-foreground mb-6">The live session could not be found or may have ended.</p>
          <Link to="/LiveSessions"><Button className="bg-primary">View My Sessions</Button></Link>
        </GlassCard>
      </div>
    );
  }

  const isWaiting = session.status === 'waiting';
  const isLive = session.status === 'live';
  const isEnded = session.status === 'ended';

  return (
    <div className="min-h-screen pb-12 px-4">
      <div className="max-w-5xl mx-auto pt-6">
        <div className="flex items-center justify-between mb-6">
          <Link to="/LiveSessions" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex items-center gap-3">
            {isLive && (
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                LIVE - {fmt(elapsed)}
              </div>
            )}
            {isWaiting && (
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs px-3 py-1.5 rounded-full">
                <Clock className="w-3 h-3" /> Waiting for Local Agent
              </div>
            )}
            {isEnded && (
              <div className="text-xs bg-card text-muted-foreground px-3 py-1.5 rounded-full">Session ended</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleEndSession}
                disabled={ending}
                className="gap-1.5 text-xs"
              >
                <Square className="w-3 h-3" /> {ending ? 'Ending...' : 'End Session'}
              </Button>
            )}
            <button
              onClick={() => setChatOpen(v => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${chatOpen ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground'}`}
            >
              <MessageCircle className="w-3.5 h-3.5" /> Chat
            </button>
          </div>
        </div>

        <div className={`grid gap-6 ${chatOpen ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
          <div className={chatOpen ? 'lg:col-span-2' : ''}>
            <GlassCard className="p-0 overflow-hidden relative" style={{ height: '480px' }}>
              {isWaiting ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-yellow-400 animate-pulse" />
                  </div>
                  <h3 className="font-semibold">Waiting for {session.avatar_name}</h3>
                  <p className="text-sm text-muted-foreground">Your Local Agent is about to start the stream. Please hold on.</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    Auto-refreshing every 5 seconds
                  </div>
                </div>
              ) : isEnded ? (
                <SessionEndedScreen session={session} user={user} />
              ) : isLive && session.session_url ? (
                <DailyVideoCall roomUrl={session.session_url} isHost={false} className="w-full h-full" />
              ) : isLive ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-black/60">
                  <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Connecting to video stream...</p>
                </div>
              ) : null}

              {isLive && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full text-xs text-white">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  {fmt(elapsed)}
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-4 mt-4 flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{session.title || session.category}</p>
                <p className="text-xs text-muted-foreground">with {session.avatar_name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium">{session.duration_minutes ? `${session.duration_minutes} min` : fmt(elapsed)}</p>
              </div>
            </GlassCard>
          </div>

          {chatOpen && (
            <div className="flex flex-col" style={{ height: '540px' }}>
              <StreamChatbox
                clientName={user?.full_name || session.client_name || 'Client'}
                avatarName={session.avatar_name || 'Local Agent'}
                bookingId={session.booking_id}
                senderRole="client"
                notifyTargetRole="avatar"
                isOpen={chatOpen}
                onClose={() => setChatOpen(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
