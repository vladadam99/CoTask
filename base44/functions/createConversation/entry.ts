import { createClient } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const reqClone = req.clone();
    const payload = await reqClone.json();
    const { bookingId, env } = payload;

    let finalEnv = env;
    if (!finalEnv) {
      try {
        const originUrl = req.headers.get("X-Origin-URL") || req.url;
        const url = new URL(originUrl);
        finalEnv = url.searchParams.get("base44_data_env") || req.headers.get("x-base44-data-env");
      } catch (e) {}
    }

    const proxiedReq = new Proxy(req, {
      get(target, prop) {
        if (prop === 'headers') {
          const headers = new Headers();
          for (const [key, value] of target.headers.entries()) {
            headers.set(key, value);
          }
          if (finalEnv) {
            headers.set("x-base44-data-env", finalEnv);
          }
          return headers;
        }
        const val = target[prop];
        return typeof val === 'function' ? val.bind(target) : val;
      }
    });

    const base44 = createClientFromRequest(proxiedReq);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!bookingId) return Response.json({ error: 'Missing bookingId' }, { status: 400 });

    // Get the booking
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    // Check if conversation already exists
    const existing = await base44.asServiceRole.entities.Conversation.filter({ booking_id: bookingId });
    if (existing.length > 0) {
      return Response.json({ conversation: existing[0] });
    }

    // Create new conversation
    const conversation = await base44.asServiceRole.entities.Conversation.create({
      participant_emails: [booking.client_email, booking.avatar_email],
      participant_names: [booking.client_name, booking.avatar_name],
      booking_id: bookingId,
      last_message: 'Booking created. Send a message to get started!',
      last_message_at: new Date().toISOString(),
      last_message_by: 'system',
      unread_by: [booking.avatar_email],
    });

    // Notify avatar of new booking request
    await base44.asServiceRole.entities.Notification.create({
      user_email: booking.avatar_email,
      title: `New booking request from ${booking.client_name}`,
      message: `${booking.category} · ${booking.duration_minutes || 60} min · $${booking.total_amount || booking.amount || 0}`,
      type: 'booking_request',
      link: `/BookingDetail?id=${bookingId}`,
      reference_id: bookingId,
    });

    console.log(`Conversation created for booking ${bookingId}`);
    return Response.json({ conversation });
  } catch (err) {
    console.error('createConversation error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});