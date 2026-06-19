import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobId } = await req.json();

    const jobs = await base44.asServiceRole.entities.JobPost.filter({ id: jobId });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Not found' }, { status: 404 });

    if (job.posted_by_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (job.stripe_payment_intent_id && !job.stripe_payment_intent_id.startsWith('sim_')) {
      await stripe.paymentIntents.capture(job.stripe_payment_intent_id);
    }

    await base44.asServiceRole.entities.JobPost.update(jobId, {
      payment_status: 'released',
      escrow_status: 'captured',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});