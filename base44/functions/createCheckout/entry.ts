import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId, amount, avatarName, category, successUrl, cancelUrl } = await req.json();
    if (!bookingId || !amount) return Response.json({ error: 'Missing required fields' }, { status: 400 });

    const amountCents = Math.round(amount * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${category || 'Session'} with ${avatarName || 'Avatar'}`,
            description: `CoTask booking — ${category}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      success_url: successUrl || `${req.headers.get('origin')}/Bookings?payment=success&booking_id=${bookingId}`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/BookingDetail?id=${bookingId}&payment=cancelled`,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        booking_id: bookingId,
        client_email: user.email,
      },
    });

    console.log(`Checkout session created for booking ${bookingId}: ${session.id}`);
    return Response.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('createCheckout error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});