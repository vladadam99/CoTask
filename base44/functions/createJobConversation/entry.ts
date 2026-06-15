import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobId, jobTitle, clientEmail, clientName, avatarEmail, avatarName, scheduledDate, action, winnerAppId } = await req.json();

    if (!jobId || !clientEmail || !avatarEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (user.email !== clientEmail && user.email !== avatarEmail && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'assign_winner' && user.email === clientEmail) {
      await base44.asServiceRole.entities.JobPost.update(jobId, {
        status: 'in_progress',
        winner_application_id: winnerAppId,
        winner_email: avatarEmail,
        escrow_status: 'authorized',
      });
      await base44.asServiceRole.entities.JobApplication.update(winnerAppId, { status: 'accepted' });
      // We'll skip rejecting all others for simplicity here, or just reject them
      const applications = await base44.asServiceRole.entities.JobApplication.filter({ job_id: jobId });
      for (const app of applications) {
        if (app.id !== winnerAppId) {
          await base44.asServiceRole.entities.JobApplication.update(app.id, { status: 'rejected' });
        }
      }
    }

    const existing = await base44.asServiceRole.entities.Conversation.filter({ booking_id: `job_${jobId}` });
    if (existing.length > 0) {
      return Response.json({ conversation: existing[0] });
    }

    const isScheduled = !!scheduledDate;
    const systemMessage = isScheduled
      ? `✅ You've been matched for: "${jobTitle}". The job is scheduled for ${new Date(scheduledDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Use this chat to discuss any details before then!`
      : `✅ You've been matched for: "${jobTitle}"! This is an immediate/ASAP job. Use this chat to coordinate and get started right away!`;

    const conversation = await base44.asServiceRole.entities.Conversation.create({
      participant_emails: [clientEmail, avatarEmail],
      participant_names: [clientName, avatarName],
      booking_id: `job_${jobId}`,
      last_message: systemMessage,
      last_message_at: new Date().toISOString(),
      last_message_by: 'system',
      unread_by: [avatarEmail, clientEmail],
    });

    await base44.asServiceRole.entities.Message.create({
      conversation_id: conversation.id,
      sender_email: 'system',
      sender_name: 'CoTask',
      content: systemMessage,
      message_type: 'system',
      is_read: false,
    });

    return Response.json({ conversation });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});