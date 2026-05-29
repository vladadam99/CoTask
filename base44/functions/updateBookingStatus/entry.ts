import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const reqClone = req.clone();
    const payload = await reqClone.json();
    const { id, status, reason, env } = payload;
    console.info("===== STARTING UPDATE BOOKING STATUS =====");
    console.info("PAYLOAD:", payload);

    // Resolve the data env from payload or headers
    let finalEnv = env;
    if (!finalEnv) {
      try {
        const originUrl = req.headers.get("X-Origin-URL") || req.url;
        const originParsed = new URL(originUrl);
        finalEnv = originParsed.searchParams.get("base44_data_env") || req.headers.get("x-base44-data-env");
      } catch (e) {}
    }
    console.info("FINAL ENV:", finalEnv);

    // Inject env into request URL so the SDK picks it up correctly
    const reqUrl = new URL(req.url);
    if (finalEnv) {
      reqUrl.searchParams.set("base44_data_env", finalEnv);
    }
    const modifiedReq = new Request(reqUrl.toString(), {
      method: req.method,
      headers: req.headers
    });

    const base44 = createClientFromRequest(modifiedReq);

    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!id || !status) {
      return Response.json({ error: 'Missing id or status' }, { status: 400 });
    }

    let booking;
    try {
      booking = await base44.entities.Booking.get(id);
    } catch(err) {
      console.error("Failed to fetch booking:", err.message);
      throw err;
    }

    // Verify that the user is the avatar for this booking
    if (booking.avatar_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: You are not the avatar for this booking' }, { status: 403 });
    }

    // Update the booking status
    await base44.entities.Booking.update(id, { status });

    // Handle side effects (notifications, conversations)
    if (status === 'accepted') {
      await base44.functions.invoke('createConversation', { bookingId: id, env: finalEnv });

      if (booking.client_email) {
        await base44.entities.Notification.create({
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
      await base44.entities.Notification.create({
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