import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  const reqClone = req.clone();
  const payload = await reqClone.json();
  const { id, env } = payload;
  
  const headers = new Headers(req.headers);
  headers.set("x-base44-data-env", env);
  
  const { createClient } = await import('npm:@base44/sdk@0.8.30');
  const token = headers.get("authorization")?.replace("Bearer ", "");
  const serviceToken = headers.get("base44-service-authorization")?.replace("Bearer ", "");
  const appId = Deno.env.get("BASE44_APP_ID") || headers.get("base44-app-id");
  const functionsVersion = headers.get("x-base44-functions-version");
  const appBaseUrl = headers.get("base44-api-url"); // From headers in testEnv: base44-api-url

  const base44 = createClient({
    appId,
    token,
    serviceToken,
    functionsVersion,
    appBaseUrl,
    dataEnv: env || "prod",
    requiresAuth: true
  });
  
  try {
    const booking = await base44.asServiceRole.entities.Booking.get(id);
    return Response.json({ booking });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});