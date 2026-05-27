import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const reqClone = req.clone();
    const payload = await reqClone.json();
    const { jobId, amountUSD, env } = payload;

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
    if (!jobId || !amountUSD) {
      return Response.json({ error: 'Missing jobId or amountUSD' }, { status: 400 });
    }

    const amountCents = Math.round(Number(amountUSD) * 100);
    if (amountCents < 50) {
      return Response.json({ error: 'Amount must be at least $0.50' }, { status: 400 });
    }

    // Fetch job first to verify it exists
    const jobs = await base44.entities.JobPost.filter({ id: jobId });
    if (!jobs || jobs.length === 0) {
      console.error('Job not found:', jobId);
      return Response.json({ error: 'Job not found' }, { status: 404 });
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
    await base44.entities.JobPost.update(jobId, {
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