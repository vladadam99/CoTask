import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id, updates } = await req.json();
    if (!id || !updates) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sessions = await base44.asServiceRole.entities.LiveSession.filter({ id });
    const session = sessions[0];
    if (!session) return Response.json({ error: 'Session not found' }, { status: 404 });

    // Both avatar and client can update the session
    if (session.avatar_email !== user.email && session.client_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedSession = await base44.asServiceRole.entities.LiveSession.update(id, updates);

    // If status changes to 'ended', send notifications
    if (updates.status === 'ended' && session.status !== 'ended') {
      const isAvatar = user.email === session.avatar_email;
      const targetEmail = isAvatar ? session.client_email : session.avatar_email;
      const senderName = user.full_name || (isAvatar ? 'The avatar' : 'The client');

      await base44.asServiceRole.entities.Notification.create({
        user_email: targetEmail,
        title: 'Session ended',
        message: `${senderName} has ended the session.`,
        type: 'system',
        reference_id: session.booking_id,
      });
    }

    return Response.json({ success: true, session: updatedSession });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});