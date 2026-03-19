import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId) return Response.json({ error: 'Missing bookingId' }, { status: 400 });

    // Get the booking
    const bookings = await base44.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    // Check if conversation already exists
    const existing = await base44.entities.Conversation.filter({ booking_id: bookingId });
    if (existing.length > 0) {
      return Response.json({ conversation: existing[0] });
    }

    // Create new conversation
    const conversation = await base44.entities.Conversation.create({
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