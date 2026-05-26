import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, action, partialAmount, disputeReason } = await req.json();
    if (!bookingId || !action) {
      return Response.json({ error: 'Missing bookingId or action' }, { status: 400 });
    }
    
    let booking = await base44.entities.Booking.get(bookingId);
    
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify that the user is the client for this booking
    if (booking.client_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: You are not the client for this booking' }, { status: 403 });
    }

    if (action === 'approve') {
      await base44.entities.Booking.update(bookingId, {
        approval_status: 'approved',
        status: 'completed',
        payment_status: 'released',
      });
      await base44.entities.Notification.create({
        user_email: booking.avatar_email,
        title: '✅ Job Approved — Payment Released',
        message: `${user.full_name} approved your work. Payment of $${booking.amount?.toFixed(2)} has been released.`,
        type: 'payment',
        reference_id: booking.id,
      });
    } else if (action === 'partial') {
      await base44.entities.Booking.update(bookingId, {
        approval_status: 'partial',
        status: 'completed',
        payment_status: 'partial',
        partial_amount: partialAmount,
      });
      await base44.entities.Notification.create({
        user_email: booking.avatar_email,
        title: 'Partial Payment Offer',
        message: `${user.full_name} has offered a partial payment of $${partialAmount.toFixed(2)} for this job.`,
        type: 'payment',
        reference_id: booking.id,
      });
    } else if (action === 'dispute') {
      await base44.entities.Booking.update(bookingId, {
        approval_status: 'disputed',
        status: 'disputed',
        payment_status: 'held',
        dispute_reason: disputeReason,
      });
      await base44.entities.Notification.create({
        user_email: booking.avatar_email,
        title: '⚠️ Dispute Raised',
        message: `${user.full_name} has raised a dispute: "${disputeReason.slice(0, 80)}"`,
        type: 'system',
        reference_id: booking.id,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('approveJob error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});