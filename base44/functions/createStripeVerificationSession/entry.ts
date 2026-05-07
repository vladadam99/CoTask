import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profile_id, profile_type } = await req.json();

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

  const session = await stripe.identity.verificationSessions.create({
    type: 'document',
    options: {
      document: {
        require_live_capture: false,
        require_matching_selfie: true,
      },
    },
    metadata: {
      user_email: user.email,
      user_id: user.id,
      profile_id: profile_id || '',
      profile_type: profile_type || '',
      base44_app_id: Deno.env.get('BASE44_APP_ID'),
    },
  });

  return Response.json({
    client_secret: session.client_secret,
    session_id: session.id,
  });
});