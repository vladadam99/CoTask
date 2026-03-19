import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import StreamViewer360 from '@/components/live/StreamViewer360';
import { ArrowLeft, Wifi, Video, MessageCircle, Clock, AlertTriangle } from 'lucide-react';
import DailyVideoCall from '@/components/live/DailyVideoCall';
import SessionEndedScreen from '@/components/live/SessionEndedScreen';

export default function ClientLiveView() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session');
  const bookingId = params.get('booking');
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  const [elapsed, setElapsed] = useState(0);
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState([{ from: 'system', text: 'You are now connected to the live stream.' }]);
  const [input, setInput] = useState('');
  const [viewMode, setViewMode] = useState('standard');
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);

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

  // Subscribe to session changes in real time — just invalidate, don't auto-navigate
  useEffect(() => {
    const unsub = base44.entities.LiveSession.subscribe((event) => {
      if (event.id === session?.id && event.type === 'update') {
        // Let the query refetch so isEnded becomes true and shows the review screen
      }
    });
    return unsub;
  }, [session?.id]);

  // Timer
  useEffect(() => {
    if (session?.status === 'live') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [session?.status]);

  useEffect(() => {
    if (session?.stream_mode) setViewMode(session.stream_mode);
  }, [session?.stream_mode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(m => [...m, { from: 'you', text: input.trim() }]);
    setInput('');
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <GlassCard className="p-10 text-center max-w-md">
        <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Session Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">The live session could not be found or may have ended.</p>
        <Link to="/LiveSessions"><Button className="bg-primary">View My Sessions</Button></Link>
      </GlassCard>
    </div>
  );

  const isWaiting = session.status === 'waiting';
  const isLive = session.status === 'live';
  const isEnded = session.status === 'ended';

  return (
    <div className="min-h-screen pb-12 px-4">
      <div className="max-w-5xl mx-auto pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/LiveSessions" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex items-center gap-3">
            {isLive && (
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                LIVE · {fmt(elapsed)}
              </div>
            )}
            {isWaiting && (
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs px-3 py-1.5 rounded-full">
                <Clock className="w-3 h-3" /> Waiting for avatar…
              </div>
            )}
            {isEnded && (
              <div className="text-xs bg-muted/50 text-muted-foreground px-3 py-1.5 rounded-full">Session ended</div>
            )}
          </div>
          <button
            onClick={() => setChatOpen(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${chatOpen ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-muted/50 border-white/10 text-muted-foreground'}`}
          >
            <MessageCircle className="w-3.5 h-3.5" /> Chat
          </button>
        </div>

        <div className={`grid gap-6 ${chatOpen ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
          {/* Video area */}
          <div className={chatOpen ? 'lg:col-span-2' : ''}>
            <GlassCard className="p-0 overflow-hidden relative" style={{ height: '480px' }}>
              {isWaiting ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-yellow-400 animate-pulse" />
                  </div>
                  <h3 className="font-semibold">Waiting for {session.avatar_name}</h3>
                  <p className="text-sm text-muted-foreground">Your avatar is about to start the stream. Please hold on…</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    Auto-refreshing every 5 seconds
                  </div>
                </div>
              ) : isEnded ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-8">
                  <Video className="w-12 h-12 text-muted-foreground/40" />
                  <h3 className="font-semibold">Session Ended</h3>
                  <p className="text-sm text-muted-foreground">This session has ended. Thank you for using CoTask!</p>
                  <Link to="/Bookings"><Button size="sm" className="bg-primary">View Bookings</Button></Link>
                </div>
              ) : isLive && session.session_url ? (
                /* Real WebRTC video via Daily.co */
                <DailyVideoCall
                  roomUrl={session.session_url}
                  isHost={false}
                  className="w-full h-full"
                />
              ) : isLive ? (
                /* Live but room URL not yet available — waiting */
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-black/60">
                  <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Connecting to video stream…</p>
                </div>
              ) : null}

              {/* Duration overlay */}
              {isLive && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full text-xs text-white">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  {fmt(elapsed)}
                </div>
              )}
            </GlassCard>

            {/* Session info */}
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

          {/* Chat */}
          {chatOpen && (
            <div className="flex flex-col" style={{ height: '540px' }}>
              <GlassCard className="flex flex-col flex-1 overflow-hidden p-0">
                <div className="p-4 border-b border-white/5 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Session Chat</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.from === 'you' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        m.from === 'system' ? 'bg-muted/40 text-muted-foreground text-xs text-center w-full rounded-lg' :
                        m.from === 'you' ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-foreground'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-white/5 flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message…"
                    className="flex-1 text-sm bg-muted/50 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground"
                  />
                  <Button size="sm" className="bg-primary" onClick={sendMessage}>Send</Button>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}