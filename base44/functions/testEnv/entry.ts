import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  const headers = new Headers(req.headers);
  headers.set('x-base44-env', 'dev');
  const devReq = new Request(req.url, { headers });
  const devBase44 = createClientFromRequest(devReq);
  
  let result;
  try {
    const list = await devBase44.asServiceRole.entities.Booking.list();
    result = list.length;
  } catch(e) {
    result = e.message;
  }
  
  return Response.json({
    result
  });
});