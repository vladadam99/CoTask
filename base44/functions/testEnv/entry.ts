import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const prodBase44 = createClientFromRequest(req);
  const prodBookings = await prodBase44.asServiceRole.entities.Booking.list();
  
  const headers = new Headers(req.headers);
  headers.set('x-base44-env', 'dev');
  const devReq = new Request(req.url, { headers });
  const devBase44 = createClientFromRequest(devReq);
  
  const devBookings = await devBase44.asServiceRole.entities.Booking.list();
  
  let devBookingGet;
  try {
    devBookingGet = await devBase44.asServiceRole.entities.Booking.get('6a13500b6d3e37ebf4583e14');
  } catch(e) {
    devBookingGet = e.message;
  }
  
  return Response.json({
    prodCount: prodBookings.length,
    devCount: devBookings.length,
    devBookingGet: !!devBookingGet
  });
});