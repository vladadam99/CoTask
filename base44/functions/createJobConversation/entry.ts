import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { jobId, jobTitle, clientEmail, clientName, avatarEmail, avatarName, scheduledDate } = await req.json();

    if (!jobId || !clientEmail || !avatarEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if conversation already exists for this job
    const existing = await base44.asServiceRole.entities.Conversation.filter({ booking_id: `job_${jobId}` });
    if (existing.length > 0) {
      return Response.json({ conversation: existing[0] });
    }

    const isScheduled = !!scheduledDate;
    const systemMessage = isScheduled
      ? `✅ You've been matched for: "${jobTitle}". The job is scheduled for ${new Date(scheduledDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Use this chat to discuss any details before then!`
      : `✅ You've been matched for: "${jobTitle}"! This is an immediate/ASAP job. Use this chat to coordinate and get started right away!`;

    // Create conversation
    const conversation = await base44.asServiceRole.entities.Conversation.create({
      participant_emails: [clientEmail, avatarEmail],
      participant_names: [clientName, avatarName],
      booking_id: `job_${jobId}`,
      last_message: systemMessage,
      last_message_at: new Date().toISOString(),
      last_message_by: 'system',
      unread_by: [avatarEmail, clientEmail],
    });

    // Post system message
    await base44.asServiceRole.entities.Message.create({
      conversation_id: conversation.id,
      sender_email: 'system',
      sender_name: 'CoTask',
      content: systemMessage,
      message_type: 'system',
      is_read: false,
    });

    // Notify avatar only (skip if same person as client)
    if (avatarEmail !== clientEmail) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: avatarEmail,
        title: '🎉 You got the job!',
        message: `You were selected for: ${jobTitle}. Open chat to get started!`,
        type: 'booking_accepted',
        link: `/Messages?conversation=${conversation.id}`,
        reference_id: jobId,
      });
    }

    // Notify client only (skip if same person as avatar)
    if (clientEmail !== avatarEmail) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: clientEmail,
        title: '✅ Job Assigned',
        message: `${avatarName} has been assigned to: ${jobTitle}. A chat has been opened!`,
        type: 'booking_accepted',
        link: `/Messages?conversation=${conversation.id}`,
        reference_id: jobId,
      });
    }

    console.log(`Job conversation created for job ${jobId}, conversation ${conversation.id}`);
    return Response.json({ conversation });
  } catch (err) {
    console.error('createJobConversation error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});