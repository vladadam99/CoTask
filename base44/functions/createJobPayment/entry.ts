import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobId, amountUSD } = await req.json();
    if (!jobId || !amountUSD) return Response.json({ error: 'Missing parameters' }, { status: 400 });

    const jobs = await base44.asServiceRole.entities.JobPost.filter({ id: jobId });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Not found' }, { status: 404 });

    if (job.posted_by_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { simulate } = await req.json();

    if (simulate) {
      await base44.asServiceRole.entities.JobPost.update(jobId, {
        stripe_payment_intent_id: `sim_${jobId}_${Date.now()}`,
        escrow_amount: Number(amountUSD),
        escrow_status: 'authorized',
      });
      return Response.json({ success: true });
    }

    const amountCents = Math.round(Number(amountUSD) * 100);

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

    await base44.asServiceRole.entities.JobPost.update(jobId, {
      stripe_payment_intent_id: paymentIntent.id,
      escrow_amount: Number(amountUSD),
      escrow_status: 'pending',
    });

    return Response.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});