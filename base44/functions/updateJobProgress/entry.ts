import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobId, action, payload } = await req.json();

    const jobs = await base44.asServiceRole.entities.JobPost.filter({ id: jobId });
    const job = jobs[0];
    if (!job) return Response.json({ error: 'Not found' }, { status: 404 });

    const isClient = user.email === job.posted_by_email;
    const isAvatar = user.email === job.winner_email;

    if (!isClient && !isAvatar && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let updates = {};

    if (action === 'start' && isAvatar) {
      updates = { started_at: new Date().toISOString() };
    } else if (action === 'mark_done' && isAvatar) {
      updates = { status: 'awaiting_approval', proof_url: payload.proof_url, proof_note: payload.proof_note, ended_at: new Date().toISOString() };
    } else if (action === 'arrival_status' && isAvatar) {
      updates = { arrival_status: payload.status, arrival_status_updated_at: new Date().toISOString() };
    } else if (action === 'progress_photo' && isAvatar) {
      updates = { progress_photos: [...(job.progress_photos || []), payload.photo_url] };
    } else if (action === 'refund' && isAvatar) {
      updates = { status: 'refunded' };
    } else if (action === 'propose_partial' && isAvatar) {
      updates = { partial_amount: payload.amount };
    } else if (action === 'accept_partial' && isClient) {
      updates = { status: 'completed' };
    } else if (action === 'complete' && isClient) {
      updates = { status: 'completed', escrow_status: 'captured' };
    } else if (action === 'reject_partial' && isClient) {
      updates = { partial_amount: null };
    } else if (action === 'escalate') {
      updates = { status: 'disputed' };
    } else if (action === 'apply') {
      updates = { application_count: (job.application_count || 0) + 1 };
    } else if (action === 'review' && isAvatar) {
      updates = { review_left_by_avatar: true };
    } else if (action === 'review' && isClient) {
      updates = { review_left_by_client: true };
    } else {
      return Response.json({ error: 'Invalid action or permission' }, { status: 400 });
    }

    await base44.asServiceRole.entities.JobPost.update(jobId, updates);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});