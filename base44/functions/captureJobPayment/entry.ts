import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobId } = await req.json();
    if (!jobId) return Response.json({ error: 'Missing jobId' }, { status: 400 });

    const jobs = await base44.asServiceRole.entities.JobPost.filter({ id: jobId });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    // Only the job poster can release payment
    if (user.email !== job.posted_by_email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!job.stripe_payment_intent_id) {
      return Response.json({ error: 'No payment intent on this job' }, { status: 400 });
    }

    // Capture the held funds
    const paymentIntent = await stripe.paymentIntents.capture(job.stripe_payment_intent_id);

    await base44.asServiceRole.entities.JobPost.update(jobId, {
      escrow_status: 'captured',
    });

    console.log(`Captured payment for job ${jobId}: ${paymentIntent.id}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('captureJobPayment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});