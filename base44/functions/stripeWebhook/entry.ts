import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const body = await req.text();

  let event;
  try {
    if (webhookSecret && sig) {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata?.booking_id;
    if (!bookingId) {
      console.warn('No booking_id in session metadata');
      return Response.json({ received: true });
    }

    try {
      const base44 = createClientFromRequest(req);
      // Mark as paid but keep status pending — avatar must still accept/decline
      await base44.asServiceRole.entities.Booking.update(bookingId, {
        payment_status: 'paid',
        status: 'pending',
      });

      // Auto-create conversation if none exists
      const convos = await base44.asServiceRole.entities.Conversation.filter({ booking_id: bookingId });
      if (convos.length === 0) {
        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
        const booking = bookings[0];
        if (booking) {
          await base44.asServiceRole.entities.Conversation.create({
            participant_emails: [booking.client_email, booking.avatar_email],
            participant_names: [booking.client_name, booking.avatar_name],
            booking_id: bookingId,
            last_message: 'Booking confirmed and paid. Say hello!',
            last_message_at: new Date().toISOString(),
            last_message_by: 'system',
            unread_by: [booking.client_email, booking.avatar_email],
          });
        }
      }

      // Notify avatar to accept or decline the paid booking
      const bookingList = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
      const booking = bookingList[0];
      if (booking) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: booking.avatar_email,
          title: 'New Booking Request — Payment Received!',
          message: `${booking.client_name} has paid for a ${booking.category} booking. Please accept or decline in your requests.`,
          type: 'booking_request',
          link: '/AvatarRequests',
          reference_id: bookingId,
        });
      }

      console.log(`Booking ${bookingId} marked as paid, awaiting avatar acceptance`);
    } catch (err) {
      console.error('Failed to update booking after payment:', err.message);
    }
  }

  return Response.json({ received: true });
});