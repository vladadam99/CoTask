import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Radio, Video, Clock, ArrowLeft } from 'lucide-react';

export default function LiveSessions() {
  const { user } = useCurrentUser();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['live-sessions', user?.email],
    queryFn: async () => {
      const all = await base44.entities.LiveSession.list('-created_date', 30);
      return all.filter(s => s.avatar_email === user?.email || s.client_email === user?.email);
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const activeSessions = sessions.filter(s => s.status === 'live' || s.status === 'waiting');
  const pastSessions = sessions.filter(s => s.status === 'ended');
  const isAvatar = user?.role === 'avatar';
  const dashPath = isAvatar ? '/AvatarDashboard' : user?.role === 'enterprise' ? '/EnterpriseDashboard' : '/UserDashboard';

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <Link to={dashPath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Live Sessions</h1>
          {isAvatar && (
            <Link to="/LiveStreamStudio">
              <Button className="bg-primary hover:bg-primary/90 glow-primary-sm gap-2">
                <Radio className="w-4 h-4" /> Go to Studio
              </Button>
            </Link>
          )}
        </div>

        {/* Active Sessions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Active Sessions
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <GlassCard key={i} className="p-5 animate-pulse h-20" />)}
            </div>
          ) : activeSessions.length > 0 ? (
            <div className="space-y-3">
              {activeSessions.map(s => (
                <GlassCard key={s.id} className="p-5 border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{s.title || s.category || 'Live Session'}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        with {user?.email === s.avatar_email ? s.client_name : s.avatar_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <StatusBadge status={s.status} />
                        {s.stream_mode && s.stream_mode !== 'standard' && (
                          <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                            {s.stream_mode.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      {isAvatar ? (
                        <Link to="/LiveStreamStudio">
                          <Button size="sm" className="bg-primary gap-1.5">
                            <Radio className="w-3.5 h-3.5" /> Studio
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/ClientLiveView?session=${s.id}`}>
                          <Button size="sm" className="bg-primary gap-1.5">
                            <Video className="w-3.5 h-3.5" /> Join Stream
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard className="p-8 text-center">
              <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No active sessions right now</p>
              <p className="text-xs text-muted-foreground mt-1">Sessions appear here when they start</p>
            </GlassCard>
          )}
        </div>

        {/* Past Sessions */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" /> Past Sessions
          </h2>
          {pastSessions.length > 0 ? (
            <div className="space-y-2">
              {pastSessions.map(s => (
                <GlassCard key={s.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{s.title || s.category || 'Session'}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.duration_minutes ? `${s.duration_minutes} min` : ''} · {user?.email === s.avatar_email ? s.client_name : s.avatar_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={s.status} />
                    {s.booking_id && (
                      <Link to={`/BookingDetail?id=${s.booking_id}`}>
                        <Button size="sm" variant="outline" className="text-xs h-7">Details</Button>
                      </Link>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No past sessions yet</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}