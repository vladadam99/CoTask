import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const jobs = await base44.asServiceRole.entities.JobPost.filter({ status: 'in_progress' });
    const now = new Date();

    const notificationPromises = [];
    let remindersSet = 0;
    let jobsStarted = 0;

    for (const job of jobs) {
      if (!job.scheduled_date || !job.winner_email) continue;

      const scheduledAt = new Date(
        job.scheduled_time
          ? `${job.scheduled_date}T${job.scheduled_time}`
          : `${job.scheduled_date}T09:00`
      );
      if (isNaN(scheduledAt.getTime())) continue;

      const diffMins = (scheduledAt.getTime() - now.getTime()) / 60000;

      // ~60 min before: send 1-hour reminder (55–65 min window)
      if (diffMins > 55 && diffMins <= 65) {
        notificationPromises.push(
          base44.asServiceRole.entities.Notification.create({
            user_email: job.winner_email,
            title: '⏰ Job starts in 1 hour!',
            message: `Your job "${job.title}" starts in about 1 hour. Make sure you're ready!`,
            type: 'session_starting',
            link: `/JobDetail?id=${job.id}`,
            reference_id: job.id,
            target_role: 'avatar',
          }),
          base44.asServiceRole.entities.Notification.create({
            user_email: job.posted_by_email,
            title: '⏰ Your job starts in 1 hour!',
            message: `"${job.title}" with your assigned avatar starts in about 1 hour.`,
            type: 'session_starting',
            link: `/JobDetail?id=${job.id}`,
            reference_id: job.id,
            target_role: 'user',
          })
        );
        remindersSet++;
        console.log(`1-hour reminder queued for job ${job.id}`);
      }

      // At start time: within 5-min window
      if (diffMins > -5 && diffMins <= 5) {
        notificationPromises.push(
          base44.asServiceRole.entities.Notification.create({
            user_email: job.winner_email,
            title: '🚀 Your job is starting now!',
            message: `"${job.title}" is starting now. Go to your chat to coordinate with the client!`,
            type: 'session_live',
            link: `/JobDetail?id=${job.id}`,
            reference_id: job.id,
            target_role: 'avatar',
          }),
          base44.asServiceRole.entities.Notification.create({
            user_email: job.posted_by_email,
            title: '🚀 Your job is starting now!',
            message: `"${job.title}" is starting now! Your avatar is ready.`,
            type: 'session_live',
            link: `/JobDetail?id=${job.id}`,
            reference_id: job.id,
            target_role: 'user',
          })
        );
        jobsStarted++;
        console.log(`Start notification queued for job ${job.id}`);
      }
    }

    // Fire all notifications in parallel
    await Promise.all(notificationPromises);

    console.log(`Done: checked=${jobs.length}, remindersSet=${remindersSet}, jobsStarted=${jobsStarted}, notificationsSent=${notificationPromises.length}`);
    return Response.json({ checked: jobs.length, remindersSet, jobsStarted });
  } catch (err) {
    console.error('scheduledJobReminders error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});