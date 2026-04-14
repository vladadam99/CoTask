import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const bookings = await base44.asServiceRole.entities.Booking.filter({ status: 'accepted' });

    const now = new Date();
    let notified = 0;
    const debugInfo = [];

    for (const booking of bookings) {
      if (!booking.scheduled_date || !booking.scheduled_time) {
        debugInfo.push({ id: booking.id, skip: 'missing date/time' });
        continue;
      }

      const startDt = new Date(`${booking.scheduled_date}T${booking.scheduled_time}:00Z`);
      if (isNaN(startDt.getTime())) {
        debugInfo.push({ id: booking.id, skip: 'invalid date' });
        continue;
      }

      const diffMins = (startDt.getTime() - now.getTime()) / 60000;
      debugInfo.push({
        id: booking.id,
        date: booking.scheduled_date,
        time: booking.scheduled_time,
        startDt: startDt.toISOString(),
        now: now.toISOString(),
        diffMins: parseFloat(diffMins.toFixed(2)),
        inWindow: diffMins > 5 && diffMins <= 25,
      });

      // Window: job starts between 5 and 25 minutes from now
      if (diffMins > 5 && diffMins <= 25) {
        const reminderKey = `booking_10min_${booking.id}`;
        const existing = await base44.asServiceRole.entities.Notification.filter({ reference_id: reminderKey });

        if (existing.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: booking.avatar_email,
            title: '⏰ Job Starting in 10 Minutes!',
            message: `Your job "${booking.category}" with ${booking.client_name || 'a client'} starts in 10 minutes. Get ready!`,
            type: 'session_starting',
            is_read: false,
            link: `/AvatarBookingDetail?id=${booking.id}`,
            reference_id: reminderKey,
            target_role: 'avatar',
          });
          notified++;
        } else {
          debugInfo.push({ id: booking.id, note: 'already notified' });
        }
      }
    }

    return Response.json({ success: true, checked: bookings.length, notified, now: now.toISOString(), debug: debugInfo });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});