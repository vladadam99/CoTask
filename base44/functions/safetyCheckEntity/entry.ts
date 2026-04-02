import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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
    const entity_id = event.entity_id;

    if (entity_type === 'message') {
      if (data.message_type === 'system') return Response.json({ ok: true, skipped: 'system message' });
      if (data.sender_email === 'system') return Response.json({ ok: true, skipped: 'system sender' });
      content = data.content;
      author_email = data.sender_email;
      if (data.message_type === 'photo') { media_url = data.content; content = null; }
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

    // Run AI safety check
    const prompt = `You are a content moderation AI for CoTask, a professional services marketplace.

Analyse this ${entity_type} content for policy violations:
Content: "${content || '[media/image content]'}"
${media_url ? `Media URL: ${media_url}` : ''}
Author: ${author_email}

Violations to check: illegal services (drugs, weapons, fraud, trafficking), sexual exploitation, hate speech/harassment/threats, scams, violence/graphic content, privacy violations.

Respond with JSON only:
{
  "safe": true/false,
  "severity": "low" | "medium" | "high" | "critical",
  "reason": "brief explanation if unsafe, null if safe",
  "category": "illegal | sexual | hate_speech | scam | violence | privacy | none",
  "user_message": "polite message to send to the user explaining what was removed and why (null if safe)"
}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          safe: { type: "boolean" },
          severity: { type: "string" },
          reason: { type: "string" },
          category: { type: "string" },
          user_message: { type: "string" }
        }
      }
    });

    if (!result.safe) {
      const actions = [];

      // 1. Store flagged content record
      actions.push(base44.asServiceRole.entities.FlaggedContent.create({
        entity_type,
        entity_id,
        content_preview: content ? content.slice(0, 200) : '[media content]',
        reason: result.reason,
        severity: result.severity || 'medium',
        author_email: author_email || 'unknown',
        status: result.severity === 'high' || result.severity === 'critical' ? 'actioned' : 'pending',
        media_url: media_url || undefined,
      }));

      // 2. For HIGH / CRITICAL — take autonomous action immediately
      if (result.severity === 'high' || result.severity === 'critical') {

        // Block the content
        if (entity_type === 'post') {
          actions.push(base44.asServiceRole.entities.Post.update(entity_id, { is_published: false }));
        } else if (entity_type === 'jobpost') {
          actions.push(base44.asServiceRole.entities.JobPost.update(entity_id, { status: 'cancelled' }));
        } else if (entity_type === 'message' && data.conversation_id) {
          // Post a system message in the conversation explaining removal
          actions.push(base44.asServiceRole.entities.Message.create({
            conversation_id: data.conversation_id,
            sender_email: 'system',
            sender_name: 'CoTask Safety',
            content: `🚫 A message in this conversation was removed for violating our Community Guidelines (${result.category?.replace('_', ' ')}). Repeated violations may result in account suspension.`,
            message_type: 'system',
          }));
        }

        // 3. Notify the offending user with the reason
        if (author_email) {
          const userFacingMessage = result.user_message ||
            `Your ${entity_type === 'jobpost' ? 'job post' : entity_type} was removed because it violated our Community Guidelines: ${result.reason}. If you believe this is an error, please contact support.`;

          actions.push(base44.asServiceRole.entities.Notification.create({
            user_email: author_email,
            title: `🚫 Your ${entity_type === 'jobpost' ? 'job post' : entity_type} was removed`,
            message: userFacingMessage,
            type: 'system',
            link: '/Safety',
            reference_id: entity_id,
          }));
        }

        // 4. Alert admins
        actions.push(base44.asServiceRole.entities.Notification.create({
          user_email: 'admin',
          title: `🚨 Auto-Removed: ${result.severity?.toUpperCase()} violation`,
          message: `${entity_type} from ${author_email} auto-blocked. Reason: ${result.reason}`,
          type: 'system',
          link: '/SafetyAgent',
          reference_id: entity_id,
        }));

        console.log(`[Safety] AUTO-BLOCKED ${entity_type} ${entity_id} (${result.severity}): ${result.reason}`);
      } else {
        // LOW/MEDIUM — flag for human review, notify admin only
        actions.push(base44.asServiceRole.entities.Notification.create({
          user_email: 'admin',
          title: `⚠️ Safety Flag: ${result.severity} — ${entity_type}`,
          message: `Review needed for ${entity_type} from ${author_email}: ${result.reason}`,
          type: 'system',
          link: '/SafetyAgent',
          reference_id: entity_id,
        }));
        console.log(`[Safety] Flagged for review ${entity_type} ${entity_id} (${result.severity}): ${result.reason}`);
      }

      await Promise.all(actions);
    }

    return Response.json({ ok: true, safe: result.safe, severity: result.severity });
  } catch (error) {
    console.error('[SafetyCheckEntity] Error:', error.message);
    return Response.json({ ok: false, error: error.message });
  }
});