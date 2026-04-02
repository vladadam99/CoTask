import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const jobId = payload?.event?.entity_id || payload?.data?.id;
    if (!jobId) return Response.json({ ok: true, skipped: 'no job id' });

    const job = payload.data || (await base44.asServiceRole.entities.JobPost.filter({ id: jobId }))[0];
    if (!job || job.status !== 'completed') return Response.json({ ok: true, skipped: 'not completed' });

    const clientEmail = job.posted_by_email;
    const avatarEmail = job.winner_email;

    if (!clientEmail || !avatarEmail) return Response.json({ ok: true, skipped: 'missing participants' });

    // Build deep link to the job conversation (if exists)
    const convos = await base44.asServiceRole.entities.Conversation.filter({});
    const linked = convos.find(c =>
      c.booking_id === `job_${job.id}` &&
      (c.participant_emails || []).includes(clientEmail)
    );
    const clientLink = linked ? `/Messages?conversation=${linked.id}` : `/Bookings`;
    const avatarLink = linked ? `/AvatarMessages?conversation=${linked.id}` : `/AvatarDashboard`;

    // Notify client to review the avatar
    if (!job.review_left_by_client) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: clientEmail,
        title: '⭐ How was your experience?',
        message: `Your job "${job.title}" is complete! Please take a moment to rate your avatar.`,
        type: 'review',
        link: clientLink,
        reference_id: job.id,
        target_role: 'user',
      });
    }

    // Notify avatar to review the client
    if (!job.review_left_by_avatar) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: avatarEmail,
        title: '⭐ Rate your client',
        message: `Job "${job.title}" completed! Leave a quick rating for your client.`,
        type: 'review',
        link: avatarLink,
        reference_id: job.id,
        target_role: 'avatar',
      });
    }

    return Response.json({ ok: true, notified: [clientEmail, avatarEmail] });
  } catch (error) {
    console.error('postJobReviewNotifier error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});