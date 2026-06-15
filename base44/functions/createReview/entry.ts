import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { booking_id, job_id, reviewed_email, reviewer_type, avatar_email, avatar_name, rating, comment, category } = payload;

    if (!reviewed_email || !rating) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const reviewData = {
      booking_id,
      job_id,
      reviewer_email: user.email,
      reviewer_name: user.full_name,
      reviewer_type,
      reviewed_email,
      avatar_email,
      avatar_name,
      rating,
      comment,
      category
    };

    const review = await base44.asServiceRole.entities.Review.create(reviewData);

    if (reviewer_type === 'client' || !reviewer_type) {
      const profiles = await base44.asServiceRole.entities.AvatarProfile.filter({ user_email: reviewed_email });
      const profile = profiles[0];
      if (profile) {
        const allReviews = await base44.asServiceRole.entities.Review.filter({ avatar_email: reviewed_email });
        const total = allReviews.reduce((s, r) => s + r.rating, 0);
        const count = allReviews.length;
        await base44.asServiceRole.entities.AvatarProfile.update(profile.id, {
          rating: Math.round((total / count) * 10) / 10,
          review_count: count,
        });
      }
    }

    await base44.asServiceRole.entities.Notification.create({
      user_email: reviewed_email,
      title: 'New Review Received',
      message: `${user.full_name} left you a ${rating}-star review.`,
      type: 'review',
      link: reviewer_type === 'client' ? `/AvatarReviews` : `/UserProfile`,
      reference_id: review.id,
      target_role: reviewer_type === 'client' ? 'avatar' : 'user'
    });

    return Response.json({ success: true, review });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});