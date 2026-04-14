import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// v2 - force redeploy
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const bookings = await base44.asServiceRole.entities.Booking.filter({ status: 'accepted' });
    console.log(`[v2] Fetched ${bookings.length} accepted bookings`);

    const now = new Date();
    let notified = 0;

    for (const booking of bookings) {
      if (!booking.scheduled_date || !booking.scheduled_time) {
        console.log(`[v2] Skipping booking ${booking.id} - missing date/time`);
        continue;
      }

      // Parse as UTC explicitly
      const startDt = new Date(`${booking.scheduled_date}T${booking.scheduled_time}:00Z`);
      if (isNaN(startDt.getTime())) {
        console.log(`[v2] Skipping booking ${booking.id} - invalid date`);
        continue;
      }

      const diffMins = (startDt.getTime() - now.getTime()) / 60000;
      console.log(`[v2] Booking ${booking.id}: date=${booking.scheduled_date} time=${booking.scheduled_time} diffMins=${diffMins.toFixed(2)} now=${now.toISOString()}`);

      // Window: job starts between 5 and 15 minutes from now
      if (diffMins > 5 && diffMins <= 15) {
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
          console.log(`[v2] Reminder sent for booking ${booking.id} to ${booking.avatar_email}`);
        } else {
          console.log(`[v2] Reminder already sent for booking ${booking.id}`);
        }
      }
    }

    console.log(`[v2] Done: checked ${bookings.length}, notified ${notified}`);
    return Response.json({ success: true, checked: bookings.length, notified });
  } catch (error) {
    console.error('[v2] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});