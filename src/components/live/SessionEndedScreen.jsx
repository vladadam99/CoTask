import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Star, CheckCircle, MessageSquare } from 'lucide-react';

export default function SessionEndedScreen({ session, user }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async () => {
    if (!rating) return;
    setSubmitting(true);
    await base44.entities.Review.create({
      booking_id: session.booking_id,
      reviewer_email: user.email,
      reviewer_name: user.full_name,
      avatar_email: session.avatar_email,
      avatar_name: session.avatar_name,
      rating,
      comment,
      category: session.category,
    });
    // Notify avatar of new review
    await base44.entities.Notification.create({
      user_email: session.avatar_email,
      title: `${user.full_name} left you a ${rating}★ review`,
      message: comment || `Rated your ${session.category} session.`,
      type: 'review',
      link: '/AvatarReviews',
      reference_id: session.booking_id,
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-400" />
      </div>
      <div>
        <h3 className="text-xl font-bold mb-1">Session Complete!</h3>
        <p className="text-sm text-muted-foreground">
          {session.duration_minutes ? `${session.duration_minutes} min` : 'Great'} session with {session.avatar_name}
        </p>
      </div>

      {!submitted ? (
        <GlassCard className="w-full max-w-sm p-5 text-left">
          <p className="text-sm font-semibold mb-3 text-center">How was your experience?</p>
          {/* Stars */}
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(i)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    i <= (hovered || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Leave a comment (optional)…"
            rows={3}
            className="w-full text-sm bg-muted/50 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground resize-none mb-3"
          />
          <Button
            className="w-full bg-primary hover:bg-primary/90"
            onClick={submitReview}
            disabled={!rating || submitting}
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </Button>
          <Link to="/Bookings" className="block text-center text-xs text-muted-foreground mt-3 hover:text-foreground">
            Skip for now
          </Link>
        </GlassCard>
      ) : (
        <GlassCard className="w-full max-w-sm p-5 text-center">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="font-semibold text-sm">Review submitted — thank you!</p>
          <p className="text-xs text-muted-foreground mt-1">Your feedback helps the community.</p>
        </GlassCard>
      )}

      <div className="flex gap-3">
        <Link to="/Bookings">
          <Button variant="outline" className="border-white/10 gap-2">View Bookings</Button>
        </Link>
        <Link to="/Messages">
          <Button variant="outline" className="border-white/10 gap-2">
            <MessageSquare className="w-4 h-4" /> Message Avatar
          </Button>
        </Link>
      </div>
    </div>
  );
}