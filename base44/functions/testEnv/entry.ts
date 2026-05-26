import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const sr = base44.asServiceRole;
  
  return Response.json({
    base44Keys: Object.keys(base44),
    srKeys: Object.keys(sr),
    base44Env: base44.env,
    srEnv: sr.env,
    reqEnv: req.headers.get('x-base44-env')
  });
});