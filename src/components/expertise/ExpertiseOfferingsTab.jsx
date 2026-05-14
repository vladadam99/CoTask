import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Clock, Calendar } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';

const SESSION_TYPE_LABELS = {
  consultation: 'Consultation',
  class: 'Class',
  coaching: 'Coaching',
  qa_session: 'Q&A Session',
  mentoring: 'Mentoring',
};

const SESSION_TYPE_ICONS = {
  consultation: '💬',
  class: '📚',
  coaching: '🎯',
  qa_session: '❓',
  mentoring: '🧠',
};

export default function ExpertiseOfferingsTab({ avatarEmail, avatarProfileId }) {
  const { data: offerings = [], isLoading } = useQuery({
    queryKey: ['avatar-expertise-offerings', avatarEmail],
    queryFn: () => base44.entities.ExpertiseOffering.filter({ avatar_email: avatarEmail, is_active: true }, '-created_date', 20),
    enabled: !!avatarEmail,
  });

  if (isLoading) return <div className="py-8 flex justify-center"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  if (offerings.length === 0) return (
    <GlassCard className="p-8 text-center">
      <p className="text-3xl mb-3">🎓</p>
      <p className="text-sm text-muted-foreground">No expert offerings listed yet</p>
    </GlassCard>
  );

  return (
    <div className="space-y-3">
      {offerings.map(o => (
        <GlassCard key={o.id} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {SESSION_TYPE_ICONS[o.session_type]} {SESSION_TYPE_LABELS[o.session_type] || o.session_type}
                </span>
                {o.topic && <span className="text-xs text-muted-foreground">{o.topic}</span>}
              </div>
              <h3 className="font-bold text-base mb-1">{o.title}</h3>
              {o.description && <p className="text-sm text-muted-foreground leading-relaxed">{o.description}</p>}
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {o.duration_minutes} min</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 flex-shrink-0">
              <p className="text-2xl font-black text-primary">${o.rate}</p>
              <Link to={`/ConsultationBooking?avatar=${avatarProfileId}&offering=${o.id}`}>
                <Button size="sm" className="gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Book Session
                </Button>
              </Link>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}