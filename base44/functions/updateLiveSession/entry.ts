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

    const isParticipant =
      session.avatar_email === user.email ||
      (session.client_email && session.client_email !== 'public' && session.client_email === user.email);
    if (!isParticipant && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedSession = await base44.asServiceRole.entities.LiveSession.update(id, updates);

    if (updates.status === 'ended' && session.status !== 'ended') {
      const endedLiveUpdates = { is_live: true, live_status: 'ended', live_url: '' };
      const [posts, reels] = await Promise.all([
        base44.asServiceRole.entities.Post.filter({ live_session_id: id }),
        base44.asServiceRole.entities.Reel.filter({ live_session_id: id }),
      ]);

      await Promise.all([
        ...posts.map((post) => base44.asServiceRole.entities.Post.update(post.id, endedLiveUpdates)),
        ...reels.map((reel) => base44.asServiceRole.entities.Reel.update(reel.id, endedLiveUpdates)),
      ]);

      const isPublicSession = session.client_email === 'public' || !session.booking_id;
      if (!isPublicSession) {
        const isAvatar = user.email === session.avatar_email;
        const targetEmail = isAvatar ? session.client_email : session.avatar_email;
        const senderName = user.full_name || (isAvatar ? 'The Local Agent' : 'The client');
        const conversations = await base44.asServiceRole.entities.Conversation.filter({ booking_id: session.booking_id });
        const conversation = conversations[0];
        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: session.booking_id });
        const booking = bookings[0];

        if (conversation) {
          await base44.asServiceRole.entities.Message.create({
            conversation_id: conversation.id,
            sender_email: user.email,
            sender_name: senderName,
            content: 'Live session ended.',
            message_type: 'system',
            participant_emails: conversation.participant_emails,
            is_read: false,
          });
          await base44.asServiceRole.entities.Conversation.update(conversation.id, {
            last_message: 'Live session ended.',
            last_message_at: new Date().toISOString(),
            last_message_by: user.email,
            unread_by: targetEmail ? [targetEmail] : [],
          });
        }

        if (targetEmail) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: targetEmail,
            title: 'Session ended',
            message: `${senderName} has ended the live session.`,
            type: 'system',
            link: conversation
              ? isAvatar ? `/Messages?conversation=${conversation.id}` : `/AvatarMessages?conversation=${conversation.id}`
              : session.booking_id ? `/UserBookingDetail?id=${session.booking_id}` : undefined,
            reference_id: session.booking_id || id,
            target_role: isAvatar ? (booking?.client_type === 'enterprise' ? 'enterprise' : 'user') : 'avatar',
          });
        }
      }
    }

    return Response.json({ success: true, session: updatedSession });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
