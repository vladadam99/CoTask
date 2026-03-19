import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { sessionId } = await req.json();
    const apiKey = Deno.env.get('DAILY_API_KEY');

    // Create a Daily room for this session
    const roomName = `cotask-${sessionId}`;
    const res = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_chat: false,
          enable_knocking: false,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 6, // 6 hour expiry
        },
      }),
    });

    if (!res.ok) {
      // Room may already exist — try fetching it
      const existing = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (existing.ok) {
        const room = await existing.json();
        return Response.json({ url: room.url, name: room.name });
      }
      const err = await res.text();
      console.error('Daily room creation error:', err);
      return Response.json({ error: 'Failed to create room' }, { status: 500 });
    }

    const room = await res.json();
    console.log('Daily room created:', room.name, room.url);
    return Response.json({ url: room.url, name: room.name });
  } catch (error) {
    console.error('createDailyRoom error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});