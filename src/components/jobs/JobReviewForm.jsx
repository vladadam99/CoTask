import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Star, Loader2, CheckCircle } from 'lucide-react';

export default function JobReviewForm({ job, user, reviewerType, onDone }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // reviewerType = 'avatar' (avatar reviews client) or 'client' (client reviews avatar)
  const reviewedEmail = reviewerType === 'avatar' ? job.posted_by_email : job.winner_email;
  const reviewedName = reviewerType === 'avatar' ? job.posted_by_name : (job.winner_email || 'Agent');
  const label = reviewerType === 'avatar' ? `Rate your client` : `Rate your avatar`;

  const submit = async () => {
    if (!rating) return;
    setLoading(true);
    
    await base44.functions.invoke('createReview', {
      job_id: job.id,
      reviewer_type: reviewerType,
      reviewed_email: reviewedEmail,
      rating,
      comment,
      category: job.category,
    });

    // Mark review done on job
    await base44.functions.invoke('updateJobProgress', {
      jobId: job.id,
      action: 'review'
    });

    setDone(true);
    setLoading(false);
    onDone?.();
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm py-2">
        <CheckCircle className="w-4 h-4" /> Review submitted — thanks!
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-3 border-t border-white/5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}>
            <Star className={`w-6 h-6 transition-colors ${s <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={2}
        placeholder={`Leave a comment about ${reviewedName}…`}
        className="w-full text-sm bg-muted/50 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground resize-none"
      />
      <Button size="sm" onClick={submit} disabled={!rating || loading} className="gap-2">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
        Submit Review
      </Button>
    </div>
  );
}