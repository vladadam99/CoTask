import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Find all in_progress jobs that have a scheduled_date
    const jobs = await base44.asServiceRole.entities.JobPost.filter({ status: 'in_progress' });
    const now = new Date();
    let remindersSet = 0;
    let jobsStarted = 0;

    for (const job of jobs) {
      if (!job.scheduled_date || !job.winner_email) continue;

      // Parse scheduled date — combine date + time if available
      const scheduledAt = new Date(job.scheduled_date);
      if (isNaN(scheduledAt.getTime())) continue;

      const diffMs = scheduledAt.getTime() - now.getTime();
      const diffMins = diffMs / 60000;

      // ~60 minutes before: send reminder (between 55-65 mins)
      if (diffMins > 55 && diffMins <= 65) {
        // Notify avatar
        await base44.asServiceRole.entities.Notification.create({
          user_email: job.winner_email,
          title: '⏰ Job starts in 1 hour!',
          message: `Your job "${job.title}" starts in about 1 hour. Make sure you're ready!`,
          type: 'session_starting',
          link: `/JobDetail?id=${job.id}`,
          reference_id: job.id,
        });
        // Notify client
        await base44.asServiceRole.entities.Notification.create({
          user_email: job.posted_by_email,
          title: '⏰ Your job starts in 1 hour!',
          message: `"${job.title}" with your assigned avatar starts in about 1 hour.`,
          type: 'session_starting',
          link: `/JobDetail?id=${job.id}`,
          reference_id: job.id,
        });
        remindersSet++;
        console.log(`1-hour reminder sent for job ${job.id}`);
      }

      // Job start time (within 5 min window of scheduled time)
      if (diffMins > -5 && diffMins <= 5) {
        // Notify avatar
        await base44.asServiceRole.entities.Notification.create({
          user_email: job.winner_email,
          title: '🚀 Your job is starting now!',
          message: `"${job.title}" is starting now. Go to your chat to coordinate with the client!`,
          type: 'session_live',
          link: `/JobDetail?id=${job.id}`,
          reference_id: job.id,
        });
        // Notify client
        await base44.asServiceRole.entities.Notification.create({
          user_email: job.posted_by_email,
          title: '🚀 Your job is starting now!',
          message: `"${job.title}" is starting now! Your avatar is ready.`,
          type: 'session_live',
          link: `/JobDetail?id=${job.id}`,
          reference_id: job.id,
        });
        jobsStarted++;
        console.log(`Start notification sent for job ${job.id}`);
      }
    }

    return Response.json({ checked: jobs.length, remindersSet, jobsStarted });
  } catch (err) {
    console.error('scheduledJobReminders error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});