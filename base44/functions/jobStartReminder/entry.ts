import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all accepted bookings (service role — no user session in scheduler)
    const bookings = await base44.asServiceRole.entities.Booking.filter({ status: 'accepted' });

    const now = new Date();
    let notified = 0;

    for (const booking of bookings) {
      if (!booking.scheduled_date || !booking.scheduled_time) continue;

      const startDt = new Date(`${booking.scheduled_date}T${booking.scheduled_time}`);
      if (isNaN(startDt.getTime())) continue;

      const diffMins = (startDt.getTime() - now.getTime()) / 60000;

      // Window: job starts between 8 and 13 minutes from now
      if (diffMins > 8 && diffMins <= 13) {
        const reminderKey = `booking_10min_${booking.id}`;

        // Deduplicate: skip if already sent
        const existing = await base44.asServiceRole.entities.Notification.filter({
          reference_id: reminderKey,
        });

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
          console.log(`10-min reminder sent for booking ${booking.id} to ${booking.avatar_email}`);
        }
      }
    }

    console.log(`Checked ${bookings.length} accepted bookings, sent ${notified} reminders`);
    return Response.json({ success: true, checked: bookings.length, notified });
  } catch (error) {
    console.error('jobStartReminder error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});