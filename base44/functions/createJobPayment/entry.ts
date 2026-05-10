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

    // Fetch job first to verify it exists and get details
    let jobs;
    try {
      jobs = await base44.asServiceRole.entities.JobPost.filter({ id: jobId });
      // If not found in production, try test database
      if (!jobs || jobs.length === 0) {
        jobs = await base44.asServiceRole.entities.JobPost.filter({ id: jobId }, undefined, undefined, { data_env: 'dev' });
      }
    } catch (err) {
      console.error('Failed to fetch job:', err.message, err.stack);
      return Response.json({ error: `Failed to fetch job: ${err.message}` }, { status: 500 });
    }
    
    if (!jobs || jobs.length === 0) {
      return Response.json({ error: 'Job not found in either database' }, { status: 404 });
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
    try {
      await base44.asServiceRole.entities.JobPost.update(jobId, {
        stripe_payment_intent_id: paymentIntent.id,
        escrow_amount: amountUSD,
        escrow_status: 'pending',
      });
    } catch (err) {
      // Try test database if production fails
      await base44.asServiceRole.entities.JobPost.update(jobId, {
        stripe_payment_intent_id: paymentIntent.id,
        escrow_amount: amountUSD,
        escrow_status: 'pending',
      }, { data_env: 'dev' });
    }

    return Response.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('createJobPayment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});