import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all accepted bookings
    const bookings = await base44.asServiceRole.entities.Booking.filter({ status: 'accepted' });

    const now = new Date();
    const tenMinsFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    const fifteenMinsFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    let notified = 0;

    for (const booking of bookings) {
      if (!booking.scheduled_date || !booking.scheduled_time) continue;

      // Parse the scheduled start datetime
      const startDt = new Date(`${booking.scheduled_date}T${booking.scheduled_time}`);

      // Check if the job starts within the 10-15 minute window (to avoid duplicate notifications)
      if (startDt >= tenMinsFromNow && startDt <= fifteenMinsFromNow) {
        // Check if we already sent this reminder (avoid duplicates)
        const existing = await base44.asServiceRole.entities.Notification.filter({
          user_email: booking.avatar_email,
          reference_id: `reminder_${booking.id}`,
        });

        if (existing.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: booking.avatar_email,
            title: '⏰ Job Starting Soon!',
            message: `Get ready — your job with ${booking.client_name || 'a client'} starts in 10 minutes.`,
            type: 'session_starting',
            is_read: false,
            link: `/AvatarRequests`,
            reference_id: `reminder_${booking.id}`,
          });
          notified++;
        }
      }
    }

    return Response.json({ success: true, notified });
  } catch (error) {
    console.error('jobStartReminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});