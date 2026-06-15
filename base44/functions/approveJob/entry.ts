import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { bookingId, action, partialAmount, disputeReason } = await req.json();
    
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];
    if (!booking) return Response.json({ error: 'Not found' }, { status: 404 });

    if (booking.client_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'approve') {
      await base44.asServiceRole.entities.Booking.update(bookingId, {
        approval_status: 'approved',
        status: 'completed',
        payment_status: 'released',
      });
      await base44.asServiceRole.entities.Notification.create({
        user_email: booking.avatar_email,
        title: '✅ Job Approved — Payment Released',
        message: `${user.full_name} approved your work. Payment released.`,
        type: 'payment',
        reference_id: booking.id,
      });
    } else if (action === 'partial') {
      await base44.asServiceRole.entities.Booking.update(bookingId, {
        approval_status: 'partial',
        status: 'completed',
        payment_status: 'partial',
        partial_amount: partialAmount,
      });
    } else if (action === 'dispute') {
      await base44.asServiceRole.entities.Booking.update(bookingId, {
        approval_status: 'disputed',
        status: 'disputed',
        payment_status: 'held',
        dispute_reason: disputeReason,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});