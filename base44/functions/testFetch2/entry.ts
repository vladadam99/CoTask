import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  const reqClone = req.clone();
  const payload = await reqClone.json();
  const { id, env } = payload;
  
  const originUrl = req.headers.get("X-Origin-URL") || req.url;
  const url = new URL(originUrl);
  const urlEnv = url.searchParams.get("base44_data_env");
  const finalEnv = env || urlEnv || req.headers.get("x-base44-data-env");

  const proxiedReq = new Proxy(req, {
    get(target, prop) {
      if (prop === 'headers') {
        const headers = new Headers(target.headers);
        if (finalEnv) {
          headers.set("x-base44-data-env", finalEnv);
        }
        return headers;
      }
      const val = target[prop];
      return typeof val === 'function' ? val.bind(target) : val;
    }
  });

  const base44 = createClientFromRequest(proxiedReq);
  
  try {
    const booking = await base44.entities.Booking.get(id);
    return Response.json({ booking, success: true });
  } catch (error) {
    return Response.json({ error: error.message, envUsed: finalEnv }, { status: 500 });
  }
});