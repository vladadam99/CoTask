import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobId, amountUSD } = await req.json();
    if (!jobId || !amountUSD) {
      return Response.json({ error: 'Missing jobId or amountUSD' }, { status: 400 });
    }

    const amountCents = Math.round(Number(amountUSD) * 100);
    if (amountCents < 50) {
      return Response.json({ error: 'Amount must be at least $0.50' }, { status: 400 });
    }

    // Create a PaymentIntent with manual capture (escrow)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      capture_method: 'manual',
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        job_id: jobId,
        client_email: user.email,
      },
    });

    // Save the PaymentIntent ID on the job
    await base44.asServiceRole.entities.JobPost.update(jobId, {
      stripe_payment_intent_id: paymentIntent.id,
      escrow_amount: amountUSD,
      escrow_status: 'pending',
    });

    return Response.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('createJobPayment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});