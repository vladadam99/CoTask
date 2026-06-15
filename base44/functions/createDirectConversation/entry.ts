import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { avatar_profile_id, target_email, target_name } = await req.json();

    let peerEmail = target_email;
    let peerName = target_name;

    if (avatar_profile_id) {
      const profiles = await base44.asServiceRole.entities.AvatarProfile.filter({ id: avatar_profile_id });
      if (!profiles.length) {
        return Response.json({ error: 'Avatar not found' }, { status: 404 });
      }
      peerEmail = profiles[0].user_email;
      peerName = profiles[0].display_name;
    }

    if (!peerEmail) {
      return Response.json({ error: 'Missing target user info' }, { status: 400 });
    }

    const participant_emails = [user.email, peerEmail];
    
    // Check if conversation already exists
    const conversations = await base44.asServiceRole.entities.Conversation.filter({
      participant_emails: { $contains: user.email }
    });
    
    const existing = conversations.find(c => 
      c.participant_emails.includes(peerEmail) && 
      !c.booking_id // only direct ones, or any
    );

    let conversation = existing;

    if (!existing) {
      conversation = await base44.asServiceRole.entities.Conversation.create({
        participant_emails,
        participant_names: [user.full_name || user.email, peerName || peerEmail]
      });

      await base44.asServiceRole.entities.Notification.create({
        user_email: peerEmail,
        title: 'New Message',
        message: `${user.full_name || 'Someone'} started a conversation with you.`,
        type: 'message',
        link: `/Messages?conversation=${conversation.id}`,
        reference_id: conversation.id,
        target_role: avatar_profile_id ? 'avatar' : 'user'
      });
    }

    return Response.json({ success: true, conversation });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});