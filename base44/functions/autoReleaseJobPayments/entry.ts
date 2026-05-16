import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Scheduled function: auto-release escrow for jobs awaiting approval > 24 hours
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all jobs awaiting approval
    const jobs = await base44.asServiceRole.entities.JobPost.filter({ status: 'awaiting_approval' }, '-updated_date', 200);

    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    let released = 0;

    for (const job of jobs) {
      // Check if ended_at is older than 24 hours
      const endedAt = job.ended_at ? new Date(job.ended_at).getTime() : null;
      if (!endedAt) continue;

      const elapsed = now - endedAt;
      if (elapsed < twentyFourHours) continue;

      console.log(`Auto-releasing payment for job ${job.id} (${job.title}) - ended ${Math.round(elapsed / 3600000)}h ago`);

      // Mark job as completed and escrow as captured
      await base44.asServiceRole.entities.JobPost.update(job.id, {
        status: 'completed',
        escrow_status: 'captured',
      });

      // Notify the avatar
      if (job.winner_email) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: job.winner_email,
          title: '💰 Payment Auto-Released!',
          message: `Your payment of $${job.escrow_amount || job.budget_max || 0} for "${job.title}" has been automatically released. The client did not raise any issues within 24 hours.`,
          type: 'payment',
          link: `/AvatarMessages`,
          reference_id: job.id,
          target_role: 'avatar',
        });
      }

      // Notify the client
      if (job.posted_by_email) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: job.posted_by_email,
          title: '✅ Job Auto-Completed',
          message: `Payment for "${job.title}" was automatically released to the avatar after 24 hours with no dispute raised.`,
          type: 'payment',
          link: `/Messages`,
          reference_id: job.id,
          target_role: 'user',
        });
      }

      released++;
    }

    console.log(`Auto-release complete: ${released} job(s) released out of ${jobs.length} checked.`);
    return Response.json({ success: true, released, checked: jobs.length });
  } catch (error) {
    console.error('autoReleaseJobPayments error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});