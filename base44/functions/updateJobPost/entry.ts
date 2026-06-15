import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { jobId, updates } = body;
    if (!jobId || !updates) {
      return Response.json({ error: 'Missing jobId or updates' }, { status: 400 });
    }

    const jobPosts = await base44.asServiceRole.entities.JobPost.filter({ id: jobId });
    const job = jobPosts[0];
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });

    if (user.email !== job.posted_by_email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Protected fields that cannot be updated via this endpoint
    const blockedFields = [
      'posted_by_email', 'posted_by_name', 'posted_by_type',
      'client_email', 'winner_email',
      'stripe_payment_intent_id', 'stripe_checkout_session_id',
      'escrow_amount', 'escrow_status', 'payment_status',
      'payout_status', 'application_count'
    ];

    const safeUpdates = { ...updates };
    for (const field of blockedFields) {
      delete safeUpdates[field];
    }

    // Update using service role
    const updatedJob = await base44.asServiceRole.entities.JobPost.update(jobId, safeUpdates);

    return Response.json({ job: updatedJob });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});