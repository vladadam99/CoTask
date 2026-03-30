import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { type } = await req.json();

    if (type === 'avatars_for_user') {
      // Get user interests
      const userInterests = user.interests || [];
      const userLocation = user.city || '';

      // Fetch available avatars
      const avatars = await base44.entities.AvatarProfile.filter({ status: 'active', is_available: true }, '-rating', 30);

      if (avatars.length === 0) return Response.json({ suggestions: [] });

      // Score avatars by interest overlap
      const scored = avatars.map(avatar => {
        const cats = avatar.categories || [];
        const overlap = cats.filter(c => userInterests.some(i =>
          i.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(i.toLowerCase())
        )).length;
        const locationBonus = avatar.city && userLocation &&
          avatar.city.toLowerCase() === userLocation.toLowerCase() ? 1 : 0;
        return { ...avatar, _score: overlap * 3 + locationBonus + (avatar.rating || 0) * 0.5 + (avatar.is_featured ? 2 : 0) };
      });

      scored.sort((a, b) => b._score - a._score);
      const top = scored.slice(0, 6);

      // Use LLM to generate a "why suggested" reason for top 3
      let withReasons = top;
      if (top.length > 0 && userInterests.length > 0) {
        const prompt = `Given a user interested in: ${userInterests.join(', ')}, provide a short 1-sentence "why suggested" reason for each of these avatars. Be specific, friendly and relevant to the user's interests. Return JSON.
Avatars: ${JSON.stringify(top.slice(0, 3).map(a => ({ id: a.id, name: a.display_name, categories: a.categories, city: a.city })))}`;
        const res = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              reasons: {
                type: 'array',
                items: { type: 'object', properties: { id: { type: 'string' }, reason: { type: 'string' } } }
              }
            }
          }
        });
        const reasons = res?.reasons || [];
        withReasons = top.map(a => {
          const r = reasons.find(x => x.id === a.id);
          return { ...a, suggestion_reason: r?.reason || null };
        });
      }

      return Response.json({ suggestions: withReasons });
    }

    if (type === 'jobs_for_avatar') {
      // Get avatar profile
      const profiles = await base44.entities.AvatarProfile.filter({ user_email: user.email });
      const profile = profiles[0];
      if (!profile) return Response.json({ suggestions: [] });

      const avatarCats = profile.categories || [];
      const avatarCity = profile.city || '';

      // Fetch open jobs
      const jobs = await base44.entities.JobPost.filter({ status: 'open' }, '-created_date', 40);
      if (jobs.length === 0) return Response.json({ suggestions: [] });

      // Score jobs
      const scored = jobs.map(job => {
        const reqSkills = job.skills_required || [];
        const overlap = reqSkills.filter(s => avatarCats.some(c =>
          c.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(c.toLowerCase())
        )).length;
        const catMatch = avatarCats.some(c =>
          (job.category || '').toLowerCase().includes(c.toLowerCase()) ||
          c.toLowerCase().includes((job.category || '').toLowerCase())
        ) ? 2 : 0;
        const locationMatch = avatarCity && job.location &&
          job.location.toLowerCase().includes(avatarCity.toLowerCase()) ? 2 : 0;
        return { ...job, _score: overlap * 2 + catMatch + locationMatch };
      });

      scored.sort((a, b) => b._score - a._score);
      return Response.json({ suggestions: scored.slice(0, 6) });
    }

    return Response.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('matchSuggestions error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});