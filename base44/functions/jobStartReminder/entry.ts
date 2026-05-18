import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const REMINDERS = [
  {
    key: 'morning',
    minMins: 60 * 8,   // 8 hours ahead
    maxMins: 60 * 24,  // up to 24 hours ahead
    avatarTitle: '📅 Job Today!',
    avatarMsg: (b) => `Reminder: You have a job "${b.category}" with ${b.client_name || 'a client'} today at ${b.scheduled_time}. Make sure you're prepared!`,
    clientTitle: '📅 Your Job is Today!',
    clientMsg: (b) => `Reminder: Your booking "${b.category}" with ${b.avatar_name || 'your avatar'} is today at ${b.scheduled_time}. Be ready!`,
  },
  {
    key: '3hr',
    minMins: 60 * 2,
    maxMins: 60 * 3,
    avatarTitle: '⏳ Job in 3 Hours!',
    avatarMsg: (b) => `Your job "${b.category}" with ${b.client_name || 'a client'} starts in about 3 hours at ${b.scheduled_time}. Start getting ready!`,
    clientTitle: '⏳ Booking in 3 Hours!',
    clientMsg: (b) => `Your booking "${b.category}" with ${b.avatar_name || 'your avatar'} starts in about 3 hours at ${b.scheduled_time}.`,
  },
  {
    key: '1hr',
    minMins: 50,
    maxMins: 70,
    avatarTitle: '🔔 1 Hour Until Your Job!',
    avatarMsg: (b) => `Your job "${b.category}" with ${b.client_name || 'a client'} starts in 1 hour! Head over now if travel is needed.`,
    clientTitle: '🔔 1 Hour Until Your Booking!',
    clientMsg: (b) => `Your booking "${b.category}" with ${b.avatar_name || 'your avatar'} starts in 1 hour! Make sure everything is set.`,
  },
  {
    key: '30min',
    minMins: 25,
    maxMins: 35,
    avatarTitle: '🚨 30 Minutes to Go!',
    avatarMsg: (b) => `URGENT: Your job "${b.category}" starts in 30 minutes! If you haven't left yet, leave now.`,
    clientTitle: '🚨 30 Minutes to Go!',
    clientMsg: (b) => `URGENT: Your booking "${b.category}" with ${b.avatar_name || 'your avatar'} starts in 30 minutes!`,
  },
  {
    key: '10min',
    minMins: 5,
    maxMins: 15,
    avatarTitle: '🔴 Job Starting in 10 Minutes!',
    avatarMsg: (b) => `FINAL REMINDER: Your job "${b.category}" with ${b.client_name || 'a client'} starts in 10 minutes. Be there NOW!`,
    clientTitle: '🔴 Job Starting in 10 Minutes!',
    clientMsg: (b) => `FINAL REMINDER: Your booking "${b.category}" with ${b.avatar_name || 'your avatar'} starts in 10 minutes!`,
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Check both accepted and scheduled jobs
    const [acceptedBookings, scheduledBookings, acceptedJobs] = await Promise.all([
      base44.asServiceRole.entities.Booking.filter({ status: 'accepted' }),
      base44.asServiceRole.entities.Booking.filter({ status: 'scheduled' }),
      base44.asServiceRole.entities.JobPost.filter({ status: 'in_progress' }),
    ]);

    const bookings = [...acceptedBookings, ...scheduledBookings];
    const now = new Date();
    let notified = 0;

    for (const booking of bookings) {
      if (!booking.scheduled_date || !booking.scheduled_time) continue;

      const startDt = new Date(`${booking.scheduled_date}T${booking.scheduled_time}:00`);
      if (isNaN(startDt.getTime())) continue;

      const diffMins = (startDt.getTime() - now.getTime()) / 60000;
      if (diffMins < 0) continue; // already started

      for (const reminder of REMINDERS) {
        if (diffMins >= reminder.minMins && diffMins < reminder.maxMins) {
          // Avatar notification
          const avatarKey = `booking_${reminder.key}_avatar_${booking.id}`;
          const existingAvatar = await base44.asServiceRole.entities.Notification.filter({ reference_id: avatarKey });
          if (existingAvatar.length === 0) {
            await base44.asServiceRole.entities.Notification.create({
              user_email: booking.avatar_email,
              title: reminder.avatarTitle,
              message: reminder.avatarMsg(booking),
              type: 'session_starting',
              is_read: false,
              link: `/AvatarBookingDetail?id=${booking.id}`,
              reference_id: avatarKey,
              target_role: 'avatar',
            });
            notified++;
          }

          // Client notification
          const clientKey = `booking_${reminder.key}_client_${booking.id}`;
          const existingClient = await base44.asServiceRole.entities.Notification.filter({ reference_id: clientKey });
          if (existingClient.length === 0) {
            await base44.asServiceRole.entities.Notification.create({
              user_email: booking.client_email,
              title: reminder.clientTitle,
              message: reminder.clientMsg(booking),
              type: 'session_starting',
              is_read: false,
              link: `/UserBookingDetail?id=${booking.id}`,
              reference_id: clientKey,
              target_role: 'user',
            });
            notified++;
          }
        }
      }
    }

    return Response.json({ success: true, checked: bookings.length, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});