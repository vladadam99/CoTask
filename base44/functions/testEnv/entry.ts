import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  const reqClone = req.clone();
  const payload = await reqClone.json();
  const { env } = payload;
  
  const headersObj = {};
  req.headers.forEach((val, key) => headersObj[key] = val);

  return Response.json({
    headers: headersObj,
    url: req.url,
    env
  });
});