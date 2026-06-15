import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { sessionId, bookingId } = await req.json();
    const apiKey = Deno.env.get('DAILY_API_KEY');

    const identifier = sessionId || bookingId;
    const roomName = `cotask-${identifier}`;
    const res = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: roomName,
        properties: { enable_chat: false, enable_knocking: false, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 6 },
      }),
    });

    if (!res.ok) {
      const existing = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, { headers: { 'Authorization': `Bearer ${apiKey}` } });
      if (existing.ok) {
        const room = await existing.json();
        if (bookingId) {
          await base44.asServiceRole.entities.Booking.update(bookingId, { meeting_platform: room.url });
        } else if (sessionId) {
          await base44.asServiceRole.entities.LiveSession.update(sessionId, { session_url: room.url });
        }
        return Response.json({ url: room.url, name: room.name });
      }
      return Response.json({ error: 'Failed to create room' }, { status: 500 });
    }

    const room = await res.json();

    if (bookingId) {
      await base44.asServiceRole.entities.Booking.update(bookingId, { meeting_platform: room.url });
    } else if (sessionId) {
      await base44.asServiceRole.entities.LiveSession.update(sessionId, { session_url: room.url });
    }

    return Response.json({ url: room.url, name: room.name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});