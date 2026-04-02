import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { entity_type, entity_id, content, author_email, media_url } = payload;

    if (!content && !media_url) {
      return Response.json({ safe: true, reason: 'No content to check' });
    }

    const prompt = `You are a content moderation AI for a professional marketplace platform called CoTask.

Analyze the following ${entity_type} content for policy violations:

Content: "${content || '[image/media content]'}"
${media_url ? `Media URL: ${media_url}` : ''}
Author: ${author_email || 'unknown'}
Entity Type: ${entity_type}

Check for these violations:
- Illegal services (drugs, weapons, fraud, trafficking)
- Sexual exploitation or explicit content
- Hate speech, harassment, threats
- Scams or misleading requests
- Violence or graphic content
- Privacy violations

Respond with JSON only:
{
  "safe": true/false,
  "severity": "low" | "medium" | "high" | "critical",
  "reason": "brief explanation if not safe, null if safe",
  "category": "illegal | sexual | hate_speech | scam | violence | privacy | none"
}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          safe: { type: "boolean" },
          severity: { type: "string" },
          reason: { type: "string" },
          category: { type: "string" }
        }
      }
    });

    if (!result.safe) {
      // Create a flagged content record
      await base44.asServiceRole.entities.FlaggedContent.create({
        entity_type,
        entity_id,
        content_preview: content ? content.slice(0, 200) : '[media content]',
        reason: result.reason,
        severity: result.severity || 'medium',
        author_email: author_email || 'unknown',
        status: 'pending',
        media_url: media_url || undefined,
      });

      // Notify admins for high/critical
      if (result.severity === 'high' || result.severity === 'critical') {
        await base44.asServiceRole.entities.Notification.create({
          user_email: 'admin',
          title: `🚨 ${result.severity === 'critical' ? 'CRITICAL' : 'High'} Safety Alert`,
          message: `Flagged ${entity_type} from ${author_email}: ${result.reason}`,
          type: 'system',
          link: '/SafetyAgent',
          reference_id: entity_id,
        });
      }

      console.log(`[Safety] Flagged ${entity_type} ${entity_id} — ${result.severity}: ${result.reason}`);
    }

    return Response.json(result);
  } catch (error) {
    console.error('[Safety] Error:', error.message);
    return Response.json({ safe: true, error: error.message });
  }
});