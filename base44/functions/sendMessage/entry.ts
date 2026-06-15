import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId, content, messageType = 'text', notifyTitle, notifyMessage, notifyType, notifyLink, notifyTargetRole } = await req.json();

    if (conversationId === 'system') {
      // Just send the notification (for apply job)
      if (notifyTitle) {
        const jobs = await base44.asServiceRole.entities.JobPost.filter({ id: notifyLink.split('=')[1] });
        if (jobs[0]) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: jobs[0].posted_by_email,
            title: notifyTitle,
            message: notifyMessage,
            type: notifyType,
            link: notifyLink,
            reference_id: jobs[0].id,
            target_role: notifyTargetRole,
          });
        }
      }
      return Response.json({ success: true });
    }

    const convos = await base44.asServiceRole.entities.Conversation.filter({ id: conversationId });
    const convo = convos[0];
    if (!convo) return Response.json({ error: 'Conversation not found' }, { status: 404 });

    if (!convo.participant_emails.includes(user.email) && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const message = await base44.asServiceRole.entities.Message.create({
      conversation_id: conversationId,
      sender_email: user.email,
      sender_name: user.full_name,
      content,
      message_type: messageType,
      participant_emails: convo.participant_emails,
      is_read: false
    });

    await base44.asServiceRole.entities.Conversation.update(conversationId, {
      last_message: content.length > 50 ? content.slice(0, 50) + '...' : content,
      last_message_at: new Date().toISOString(),
      last_message_by: user.email,
    });

    // Notify other
    const otherEmail = convo.participant_emails.find(e => e !== user.email);
    if (otherEmail && notifyTitle) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: otherEmail,
        title: notifyTitle,
        message: notifyMessage || (content.length > 80 ? content.slice(0, 80) + '…' : content),
        type: notifyType || 'message',
        link: notifyLink || `/Messages?conversation=${conversationId}`,
        reference_id: conversationId,
        target_role: notifyTargetRole || 'user',
      });
    }

    return Response.json({ message });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});