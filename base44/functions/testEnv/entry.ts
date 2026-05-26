import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  return Response.json({
    config: typeof base44.getConfig === 'function' ? base44.getConfig() : null
  });
});