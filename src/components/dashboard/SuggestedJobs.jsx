import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, MapPin, DollarSign } from 'lucide-react';

export default function SuggestedJobs({ user, profile }) {
  const { data, isLoading } = useQuery({
    queryKey: ['suggested-jobs', user?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke('matchSuggestions', { type: 'jobs_for_avatar' });
      return res.data?.suggestions || [];
    },
    enabled: !!user && !!profile,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data?.length) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-base font-bold">Jobs Matched for You</h2>
        </div>
        <Link to="/JobMarketplace" className="text-xs text-primary hover:underline">See all →</Link>
      </div>
      <div className="space-y-3">
        {data.slice(0, 3).map(job => (
          <Link key={job.id} to={`/JobDetail?id=${job.id}`}>
            <div className="glass border border-white/5 hover:border-primary/30 rounded-2xl p-4 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{job.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{job.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{job.category}</span>
                  </div>
                </div>
                {(job.budget_min || job.budget_max) && (
                  <div className="flex items-center gap-1 text-primary font-bold text-sm flex-shrink-0">
                    <DollarSign className="w-3 h-3" />
                    {job.budget_min && job.budget_max
                      ? `${job.budget_min}–${job.budget_max}`
                      : job.budget_min || job.budget_max}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}