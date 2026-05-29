import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const headers = new Headers(req.headers);
    headers.set('x-base44-data-env', 'dev');
    
    const modifiedReq = new Request(req.url, { method: req.method, headers });
    const base44 = createClientFromRequest(modifiedReq);
    
    const bookings = await base44.entities.Booking.filter({});
    
    return Response.json({ success: true, count: bookings.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});