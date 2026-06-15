import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle } from 'lucide-react';

export default function LeaveReview({ booking, user, onDone }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('createReview', {
        booking_id: booking.id,
        reviewer_type: 'client',
        reviewed_email: booking.avatar_email,
        avatar_email: booking.avatar_email,
        avatar_name: booking.avatar_name,
        rating,
        comment,
        category: booking.category,
      });
      return response.data.review;
    },
    onSuccess: () => {
      setDone(true);
      queryClient.invalidateQueries({ queryKey: ['booking', booking.id] });
      onDone?.();
    },
  });

  if (done) return (
    <GlassCard className="p-5 border-green-500/20">
      <div className="flex items-center gap-3 text-green-400">
        <CheckCircle className="w-5 h-5" />
        <p className="text-sm font-medium">Review submitted. Thank you!</p>
      </div>
    </GlassCard>
  );

  return (
    <GlassCard className="p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Star className="w-4 h-4 text-yellow-400" /> Leave a Review
      </h3>
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(i)}
          >
            <Star className={`w-7 h-7 transition-colors ${i <= (hover || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share your experience…"
        className="bg-muted/50 border-white/5 h-20 mb-4"
      />
      <Button
        className="bg-primary hover:bg-primary/90 w-full"
        disabled={rating === 0 || submit.isPending}
        onClick={() => submit.mutate()}
      >
        {submit.isPending ? 'Submitting…' : 'Submit Review'}
      </Button>
    </GlassCard>
  );
}