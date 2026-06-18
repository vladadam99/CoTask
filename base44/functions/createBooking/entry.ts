import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { avatar_profile_id, avatar_email, avatar_name, category, ...rest } = payload;

    if (!avatar_profile_id || !avatar_email) {
      return Response.json({ error: 'Missing Local Agent details.' }, { status: 400 });
    }
    if (!category) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const bookingData = {
      ...rest,
      client_email: user.email,
      client_name: user.full_name,
      avatar_email,
      avatar_name,
      avatar_profile_id,
      category,
      status: 'pending'
    };

    const booking = await base44.asServiceRole.entities.Booking.create(bookingData);

    await base44.asServiceRole.entities.Notification.create({
      user_email: avatar_email,
      title: 'New Booking Request',
      message: `${user.full_name} sent you a new booking request.`,
      type: 'booking_request',
      link: `/AvatarBookingDetail?id=${booking.id}`,
      reference_id: booking.id,
      target_role: 'avatar'
    });

    return Response.json({ success: true, booking });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});