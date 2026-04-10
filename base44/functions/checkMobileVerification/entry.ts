import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { session_id } = await req.json();

    if (!session_id) {
      return Response.json({ error: 'session_id required' }, { status: 400 });
    }

    // Look up the verification session result stored by the mobile verifyIdentity call
    const sessions = await base44.asServiceRole.entities.VerificationSession.filter({ session_id });

    if (!sessions || sessions.length === 0) {
      return Response.json({ completed: false });
    }

    const session = sessions[0];
    return Response.json({ completed: true, result: session.result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});