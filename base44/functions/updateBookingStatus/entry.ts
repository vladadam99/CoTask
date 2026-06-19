import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id, status, reason, action, payload } = await req.json();

    const bookings = await base44.asServiceRole.entities.Booking.filter({ id });
    const booking = bookings[0];
    if (!booking) return Response.json({ error: 'Not found' }, { status: 404 });

    if (booking.avatar_email !== user.email && booking.client_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'proof' && user.email === booking.avatar_email) {
      await base44.asServiceRole.entities.Booking.update(id, {
        status: 'awaiting_approval',
        proof_url: payload.proof_url,
        proof_note: payload.proof_note
      });
      await base44.asServiceRole.entities.Notification.create({
        user_email: booking.client_email,
        title: '📸 Job Proof Submitted — Please Review',
        message: `${booking.avatar_name} has submitted proof of completion. Review and release payment.`,
        type: 'booking_accepted',
        link: `/UserBookingDetail?id=${booking.id}`,
        reference_id: booking.id,
      });
      return Response.json({ success: true });
    }
    
    if (action === 'review' && user.email === booking.avatar_email) {
      await base44.asServiceRole.entities.Booking.update(id, { review_left_by_avatar: true });
      return Response.json({ success: true });
    }

    if (action === 'review' && user.email === booking.client_email) {
      await base44.asServiceRole.entities.Booking.update(id, { review_left_by_client: true });
      return Response.json({ success: true });
    }

    if (action === 'accept_counter_offer') {
      if (!payload.offer_id) return Response.json({ error: 'Missing offer id' }, { status: 400 });
      const offers = await base44.asServiceRole.entities.CounterOffer.filter({ id: payload.offer_id, booking_id: id });
      const offer = offers[0];
      if (!offer) return Response.json({ error: 'Offer not found' }, { status: 404 });
      if (offer.offered_by_email === user.email) {
        return Response.json({ error: 'You cannot accept your own counter-offer' }, { status: 403 });
      }

      const newAmount = offer.amount;
      const fee = parseFloat((newAmount * 0.10).toFixed(2));
      const totalAmount = parseFloat((newAmount + fee).toFixed(2));

      await base44.asServiceRole.entities.Booking.update(id, {
        amount: newAmount,
        service_fee: fee,
        total_amount: totalAmount,
        status: 'accepted'
      });
      
      // Notify client and create conversation since status is now accepted
      await base44.functions.invoke('createConversation', { bookingId: id });
      if (booking.client_email) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: booking.client_email,
          title: 'Local Agent Accepted!',
          message: `${booking.avatar_name} accepted your request at the new price. Please fund Secure Payment to confirm.`,
          type: 'booking_accepted',
          link: `/UserBookingDetail?id=${id}`,
          reference_id: id,
          target_role: 'user',
        });
      }
      
      return Response.json({ success: true });
    }

    if (action === 'start_session' && booking.avatar_email === user.email) {
      await base44.asServiceRole.entities.Booking.update(id, { status: 'in_progress', session_id: payload.session_id });
      await base44.asServiceRole.entities.Notification.create({
        user_email: booking.client_email,
        title: `${user.full_name} is now LIVE!`,
        message: `Your ${booking.category} session has started. Tap to join.`,
        type: 'session_live',
        link: `/ClientLiveView?session=${payload.session_id}`,
        reference_id: payload.session_id,
      });
      return Response.json({ success: true });
    }

    if (action === 'complete_session' && booking.avatar_email === user.email) {
      await base44.asServiceRole.entities.Booking.update(booking.id, {
        status: 'completed',
        payment_status: 'paid',
      });
      const avatarList = await base44.asServiceRole.entities.AvatarProfile.filter({ user_email: user.email });
      if (avatarList[0]) {
        const earned = booking.amount || 0;
        await base44.asServiceRole.entities.AvatarProfile.update(avatarList[0].id, {
          total_earnings: (avatarList[0].total_earnings || 0) + earned,
          completed_jobs: (avatarList[0].completed_jobs || 0) + 1,
        });
      }
      if (booking.client_email) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: booking.client_email,
          title: 'Session Complete — Leave a Review',
          message: `Your session with ${user.full_name} has ended. How was it?`,
          type: 'review',
          link: `/UserBookingDetail?id=${booking.id}`,
          reference_id: booking.id,
        });
      }
      await base44.asServiceRole.entities.Notification.create({
        user_email: user.email,
        title: 'Session Ended',
        message: `Your session with ${booking.client_name} has been completed and payment released.`,
        type: 'payment',
        reference_id: booking.id,
      });
      return Response.json({ success: true });
    }

    if (status) {
      if ((status === 'accepted' || status === 'declined' || status === 'completed') && user.email !== booking.avatar_email && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updates = { status };
      if (status === 'completed') {
        updates.payment_status = 'paid';
      }

      await base44.asServiceRole.entities.Booking.update(id, updates);

      if (status === 'accepted') {
        await base44.functions.invoke('createConversation', { bookingId: id });
        if (booking.client_email) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: booking.client_email,
            title: 'Local Agent Accepted!',
            message: `${user.full_name} accepted your request. Please fund Secure Payment to confirm.`,
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
          message: `${user.full_name} declined your booking request.${reason ? ` Reason: ${reason}` : ''}`,
          type: 'booking_declined',
          link: `/UserBookingDetail?id=${id}`,
          reference_id: id,
        });
      }
    }

    return Response.json({ success: true, booking: { ...booking, status } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});