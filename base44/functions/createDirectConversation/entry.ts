import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { avatar_profile_id } = await req.json();

    if (!avatar_profile_id) {
      return Response.json({ error: 'Missing avatar_profile_id' }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.AvatarProfile.filter({ id: avatar_profile_id });
    if (!profiles.length) {
      return Response.json({ error: 'Avatar not found' }, { status: 404 });
    }
    const avatar = profiles[0];

    const participant_emails = [user.email, avatar.user_email];
    
    // Check if conversation already exists
    const conversations = await base44.asServiceRole.entities.Conversation.filter({
      participant_emails: { $contains: user.email }
    });
    
    const existing = conversations.find(c => 
      c.participant_emails.includes(avatar.user_email) && 
      !c.booking_id // only direct ones, or any
    );

    let conversation = existing;

    if (!existing) {
      conversation = await base44.asServiceRole.entities.Conversation.create({
        participant_emails,
        participant_names: [user.full_name, avatar.display_name]
      });

      await base44.asServiceRole.entities.Notification.create({
        user_email: avatar.user_email,
        title: 'New Message',
        message: `${user.full_name} started a conversation with you.`,
        type: 'message',
        link: `/AvatarMessages?id=${conversation.id}`,
        reference_id: conversation.id,
        target_role: 'avatar'
      });
    }

    return Response.json({ success: true, conversation });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});