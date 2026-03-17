import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import GlassCard from '@/components/ui/GlassCard';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function LatestMessages({ user }) {
  const { data: conversations = [] } = useQuery({
    queryKey: ['latest-conversations', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Conversation.list('-updated_date', 20);
      return all.filter(c => (c.participant_emails || []).includes(user.email)).slice(0, 4);
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const getOtherName = (convo) => {
    const idx = (convo.participant_emails || []).findIndex(e => e !== user?.email);
    return (convo.participant_names || [])[idx] || 'Unknown';
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" /> Latest Messages
        </h2>
        <Link to="/Messages" className="text-sm text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map(c => (
            <Link key={c.id} to="/Messages">
              <GlassCard className="p-3 flex items-center gap-3" hover>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {getOtherName(c)[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{getOtherName(c)}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.last_message || 'No messages yet'}</p>
                </div>
                {c.last_message_at && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true })}
                  </span>
                )}
              </GlassCard>
            </Link>
          ))}
        </div>
      ) : (
        <GlassCard className="p-6 text-center">
          <MessageSquare className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No messages yet</p>
        </GlassCard>
      )}
    </div>
  );
}