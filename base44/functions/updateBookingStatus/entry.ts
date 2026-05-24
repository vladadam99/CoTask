import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status, reason } = await req.json();
    if (!id || !status) {
      return Response.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const bookings = await base44.asServiceRole.entities.Booking.filter({ id });
    const booking = bookings[0];
    
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify that the user is the avatar for this booking
    if (booking.avatar_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: You are not the avatar for this booking' }, { status: 403 });
    }

    // Update the booking status
    await base44.asServiceRole.entities.Booking.update(id, { status });

    // Handle side effects (notifications, conversations)
    if (status === 'accepted') {
      await base44.asServiceRole.functions.invoke('createConversation', { bookingId: id });
      
      if (booking.client_email) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: booking.client_email,
          title: 'Booking Accepted!',
          message: `${user.full_name} accepted your ${booking.category} booking request.`,
          type: 'booking_accepted',
          link: `/UserBookingDetail?id=${id}`,
          reference_id: id,
          target_role: 'user',
        });
      }
    } else if (status === 'declined' && booking.client_email) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: booking.client_email,
        title: 'Booking Declined',
        message: `${user.full_name} declined your ${booking.category} booking request.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'booking_declined',
        link: `/UserBookingDetail?id=${id}`,
        reference_id: id,
      });
    }

    return Response.json({ success: true, booking: { ...booking, status } });
  } catch (error) {
    console.error('updateBookingStatus error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});