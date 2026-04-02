import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Automation handler: triggered on create events for Post, Message, JobPost
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;
    if (!data || !event) return Response.json({ ok: true });

    let content = null;
    let author_email = null;
    let media_url = null;
    const entity_type = event.entity_name?.toLowerCase();

    if (entity_type === 'message') {
      if (data.message_type === 'system') return Response.json({ ok: true, skipped: 'system message' });
      content = data.content;
      author_email = data.sender_email;
      if (data.message_type === 'photo') {
        media_url = data.content;
        content = null;
      }
    } else if (entity_type === 'post') {
      content = data.caption || '';
      author_email = data.avatar_email;
      media_url = data.media_url;
    } else if (entity_type === 'jobpost') {
      content = `${data.title || ''} ${data.description || ''}`.trim();
      author_email = data.posted_by_email;
    } else {
      return Response.json({ ok: true, skipped: 'unknown entity type' });
    }

    // Call the safety check function
    const result = await base44.asServiceRole.functions.invoke('safetyCheck', {
      entity_type,
      entity_id: event.entity_id,
      content,
      author_email,
      media_url,
    });

    console.log(`[SafetyCheckEntity] ${entity_type} ${event.entity_id}: safe=${result?.safe}`);
    return Response.json({ ok: true, result });
  } catch (error) {
    console.error('[SafetyCheckEntity] Error:', error.message);
    return Response.json({ ok: false, error: error.message });
  }
});