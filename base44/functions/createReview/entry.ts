import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { job_id, reviewer_type, rating, comment, category, reviewed_email } = body;

    if (!job_id || !reviewer_type || !rating || !reviewed_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Load JobPost or Booking (we'll assume job_id maps to JobPost.id or Booking.id)
    // First try JobPost
    let jobPosts = await base44.asServiceRole.entities.JobPost.filter({ id: job_id });
    let entity = jobPosts[0];
    let isBooking = false;

    if (!entity) {
      const bookings = await base44.asServiceRole.entities.Booking.filter({ id: job_id });
      entity = bookings[0];
      isBooking = true;
    }

    if (!entity) return Response.json({ error: 'Job or Booking not found' }, { status: 404 });

    // Verify participation
    let clientEmail = isBooking ? entity.client_email : entity.posted_by_email;
    let avatarEmail = isBooking ? entity.avatar_email : entity.winner_email;

    if (!avatarEmail) {
       return Response.json({ error: 'No avatar assigned to this job' }, { status: 400 });
    }

    if (reviewer_type === 'avatar' && user.email !== avatarEmail) {
      return Response.json({ error: 'Forbidden: You are not the avatar for this job' }, { status: 403 });
    }

    if (reviewer_type === 'client' && user.email !== clientEmail) {
      return Response.json({ error: 'Forbidden: You are not the client for this job' }, { status: 403 });
    }

    // Verify counterparty
    let expectedReviewedEmail = reviewer_type === 'avatar' ? clientEmail : avatarEmail;
    if (reviewed_email !== expectedReviewedEmail) {
      return Response.json({ error: 'Forbidden: Invalid counterparty' }, { status: 403 });
    }

    // Check for duplicate review
    const existingReviews = await base44.asServiceRole.entities.Review.filter({
      job_id: job_id,
      reviewer_email: user.email
    });

    if (existingReviews.length > 0) {
      return Response.json({ error: 'You have already reviewed this job' }, { status: 400 });
    }

    // Resolve names safely
    const reviewedName = isBooking 
      ? (reviewer_type === 'avatar' ? entity.client_name : entity.avatar_name) 
      : (reviewer_type === 'avatar' ? entity.posted_by_name : (entity.winner_email || 'Avatar'));

    // Create Review
    const newReview = await base44.asServiceRole.entities.Review.create({
      job_id: job_id,
      reviewer_email: user.email,
      reviewer_name: user.full_name,
      reviewer_type: reviewer_type,
      reviewed_email: reviewed_email,
      avatar_email: avatarEmail,
      avatar_name: isBooking ? entity.avatar_name : (entity.winner_email || 'Avatar'),
      rating: rating,
      comment: comment || '',
      category: category || entity.category,
    });

    // Update AvatarProfile rating
    if (reviewer_type === 'client') {
      const allReviews = await base44.asServiceRole.entities.Review.filter({ reviewed_email: avatarEmail });
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      const profiles = await base44.asServiceRole.entities.AvatarProfile.filter({ user_email: avatarEmail });
      
      if (profiles[0]) {
        await base44.asServiceRole.entities.AvatarProfile.update(profiles[0].id, {
          rating: Math.round(avg * 10) / 10,
          review_count: allReviews.length,
        });
      }
    }

    // Notify the reviewed user
    await base44.asServiceRole.entities.Notification.create({
      user_email: reviewed_email,
      title: 'New Review',
      message: `${user.full_name} left you a ${rating}-star review.`,
      type: 'review',
      link: isBooking ? `/AvatarBookingDetail?id=${job_id}` : `/JobDetail?id=${job_id}`,
      target_role: reviewer_type === 'avatar' ? 'user' : 'avatar'
    });

    return Response.json({ success: true, review: newReview });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});