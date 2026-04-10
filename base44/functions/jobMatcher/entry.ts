import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data } = payload;

    if (!data || !event) return Response.json({ ok: true });

    const job = data;
    if (!job.location || !job.category) {
      console.log('[JobMatcher] Job missing location or category, skipping');
      return Response.json({ ok: true, skipped: 'missing location or category' });
    }

    // Get all available avatars
    const avatars = await base44.asServiceRole.entities.AvatarProfile.filter({ is_available: true });
    if (!avatars.length) return Response.json({ ok: true, matched: 0 });

    // Build avatar summary for LLM matching
    const avatarSummaries = avatars.map(a => ({
      id: a.id,
      email: a.user_email,
      name: a.display_name,
      city: a.city || '',
      country: a.country || '',
      categories: a.categories || [],
      skills: a.skills || [],
      willing_to_travel: a.willing_to_travel || false,
      travel_radius_km: a.travel_radius_km || 0,
      hourly_rate: a.hourly_rate,
      has_cv: !!a.cv_url,
    }));

    // Collect CV URLs to include in AI analysis
    const avatarCvMap = {};
    avatars.forEach(a => { if (a.cv_url) avatarCvMap[a.user_email] = a.cv_url; });
    const cvFileUrls = Object.values(avatarCvMap).slice(0, 10); // cap at 10 for API limits

    const prompt = `You are a job matching engine for CoTask marketplace.

New Job Posted:
- Title: ${job.title}
- Category: ${job.category}
- Location: ${job.location}
- Skills Required: ${(job.skills_required || []).join(', ') || 'none specified'}
- Budget: ${job.budget_min ? `$${job.budget_min}–$${job.budget_max || job.budget_max} ${job.currency || 'USD'}` : 'negotiable'} per ${job.duration_type || 'hour'}
- Description: ${(job.description || '').slice(0, 300)}

Available Avatars:
${JSON.stringify(avatarSummaries, null, 2)}

${cvFileUrls.length ? `CV Documents: The attached files are CVs from avatars who have uploaded them. Use them to better assess skills, experience, and suitability for this job. Match each CV to the avatar by cross-referencing the names and emails listed above.` : ''}

STRICT matching rules:
1. Location MUST match — only select avatars whose city/area is in or near the job location. 
   - Same city = always eligible
   - Different city but willing_to_travel = true AND same country/region = eligible
   - Different country or clearly different region = NEVER eligible
2. Category must be in the avatar's categories list
3. Skills overlap is a bonus — use CV content when available to verify real experience
4. If a CV is provided, analyse it for relevant experience, qualifications and suitability

Return JSON with matched avatar emails and a short personalised reason for each:
{
  "matches": [
    { "email": "avatar@email.com", "name": "Avatar Name", "reason": "Based in London, skilled in Photography, CV shows 3 years experience" }
  ]
}
Only include genuine matches. Empty array if none.`;

    const matchResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: cvFileUrls.length ? cvFileUrls : undefined,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          matches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                name: { type: 'string' },
                reason: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const matches = matchResult?.matches || [];
    console.log(`[JobMatcher] Job "${job.title}" in ${job.location} — ${matches.length} avatar matches`);

    if (!matches.length) return Response.json({ ok: true, matched: 0 });

    // Send notifications to all matched avatars
    const notifications = matches.map(match =>
      base44.asServiceRole.entities.Notification.create({
        user_email: match.email,
        title: `🎯 New job match: ${job.title}`,
        message: `A new ${job.category} job in ${job.location} matches your profile. ${match.reason}. ${job.budget_min ? `Rate: $${job.budget_min}${job.budget_max ? `–$${job.budget_max}` : ''}/${job.duration_type || 'hr'}.` : 'Rate negotiable.'} Apply now!`,
        type: 'booking_request',
        link: `/JobDetail?id=${event.entity_id}`,
        reference_id: event.entity_id,
        target_role: 'avatar',
      })
    );

    // Also send a direct message in existing conversations if any
    const messageTasks = matches.map(async (match) => {
      const existingConvos = await base44.asServiceRole.entities.Conversation.filter({});
      const convo = existingConvos.find(c =>
        (c.participant_emails || []).includes(match.email) &&
        (c.participant_emails || []).includes(job.posted_by_email)
      );
      if (convo) {
        await base44.asServiceRole.entities.Message.create({
          conversation_id: convo.id,
          sender_email: 'system',
          sender_name: 'CoTask Matching',
          content: `🎯 Job Match Alert! A new job "${job.title}" in ${job.location} matches your profile.\n\n📍 Location: ${job.location}\n🏷️ Category: ${job.category}\n💰 ${job.budget_min ? `$${job.budget_min}${job.budget_max ? `–$${job.budget_max}` : ''}/${job.duration_type || 'hr'}` : 'Rate negotiable'}\n\nView and apply: /JobDetail?id=${event.entity_id}`,
          message_type: 'system',
        });
      }
    });

    await Promise.all([...notifications, ...messageTasks]);

    // Notify the job poster how many avatars were alerted
    await base44.asServiceRole.entities.Notification.create({
      user_email: job.posted_by_email,
      title: `✅ ${matches.length} avatar${matches.length > 1 ? 's' : ''} notified about your job`,
      message: `We've found and notified ${matches.length} matching avatar${matches.length > 1 ? 's' : ''} in ${job.location} about "${job.title}". Expect applications soon!`,
      type: 'system',
      link: `/JobDetail?id=${event.entity_id}`,
      reference_id: event.entity_id,
    });

    return Response.json({ ok: true, matched: matches.length, matches: matches.map(m => m.email) });
  } catch (error) {
    console.error('[JobMatcher] Error:', error.message);
    return Response.json({ ok: false, error: error.message });
  }
});