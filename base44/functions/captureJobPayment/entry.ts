import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const reqClone = req.clone();
    const payload = await reqClone.json();
    const { jobId, env } = payload;

    let finalEnv = env;
    if (!finalEnv) {
      try {
        const originUrl = req.headers.get("X-Origin-URL") || req.url;
        const url = new URL(originUrl);
        finalEnv = url.searchParams.get("base44_data_env") || req.headers.get("x-base44-data-env");
      } catch (e) {}
    }

    const token = req.headers.get("authorization");
    const appId = Deno.env.get("BASE44_APP_ID") || "69b9596ede4b46ad27189dde";
    const appBaseUrl = "https://app.base44.com";

    const base44 = createClient({
      appId,
      token,
      appBaseUrl,
      dataEnv: finalEnv || "dev"
    });
    
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!jobId) return Response.json({ error: 'Missing jobId' }, { status: 400 });

    const jobs = await base44.entities.JobPost.filter({ id: jobId });
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

    await base44.entities.JobPost.update(jobId, {
      escrow_status: 'captured',
    });

    console.log(`Captured payment for job ${jobId}: ${paymentIntent.id}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('captureJobPayment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});