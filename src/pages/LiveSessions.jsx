import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Radio, Video, Clock, Users } from 'lucide-react';

export default function LiveSessions() {
  const { user } = useCurrentUser();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['live-sessions', user?.email],
    queryFn: async () => {
      const all = await base44.entities.LiveSession.list('-created_date', 20);
      return all.filter(s => s.avatar_email === user?.email || s.client_email === user?.email);
    },
    enabled: !!user,
  });

  const dashPath = user?.app_role === 'avatar' ? '/AvatarDashboard' : user?.app_role === 'enterprise' ? '/EnterpriseDashboard' : '/UserDashboard';
  const activeSessions = sessions.filter(s => s.status === 'live' || s.status === 'waiting');
  const pastSessions = sessions.filter(s => s.status === 'ended');

  return (
    <div className="min-h-screen pb-12 px-4">
      <div className="max-w-3xl mx-auto pt-8">
        <Link to={dashPath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Live Sessions</h1>
          {user?.app_role === 'avatar' && (
            <Button className="bg-primary hover:bg-primary/90 glow-primary-sm">
              <Radio className="w-4 h-4 mr-2" /> Start New Session
            </Button>
          )}
        </div>

        {/* Active Sessions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Active Sessions
          </h2>
          {activeSessions.length > 0 ? (
            <div className="space-y-3">
              {activeSessions.map(s => (
                <GlassCard key={s.id} className="p-5 border-primary/20" hover>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{s.title || s.category || 'Live Session'}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {user?.email === s.avatar_email ? s.client_name : s.avatar_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={s.status} />
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        <Video className="w-4 h-4 mr-1" /> Join
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard className="p-8 text-center">
              <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No active sessions right now</p>
              <p className="text-xs text-muted-foreground mt-1">Live sessions will appear here when they start</p>
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
                <GlassCard key={s.id} className="p-4 flex items-center justify-between" hover>
                  <div>
                    <p className="text-sm font-medium">{s.title || s.category || 'Session'}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.duration_minutes ? `${s.duration_minutes} min` : ''} · {user?.email === s.avatar_email ? s.client_name : s.avatar_name}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No past sessions yet</p>
            </GlassCard>
          )}
        </div>

        {/* Future Integration Note */}
        <GlassCard className="p-6 mt-8 border-primary/10">
          <div className="flex items-start gap-4">
            <Video className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm mb-1">Live Video Coming Soon</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We're integrating real-time video, audio, and 360° streaming capabilities. 
                Sessions currently use text-based coordination. Full live streaming will be available in the next update.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}