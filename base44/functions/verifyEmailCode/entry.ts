import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const { email, code } = await req.json();
    if (!email || !code) return Response.json({ error: 'Email and code are required' }, { status: 400 });

    const base44 = createClientFromRequest(req);

    const records = await base44.asServiceRole.entities.EmailVerification.filter({ email, code });

    if (records.length === 0) {
      return Response.json({ error: 'Invalid code' }, { status: 400 });
    }

    const record = records[0];

    if (record.used) {
      return Response.json({ error: 'Code already used' }, { status: 400 });
    }

    if (new Date(record.expires_at) < new Date()) {
      return Response.json({ error: 'Code expired. Please request a new one.' }, { status: 400 });
    }

    await base44.asServiceRole.entities.EmailVerification.update(record.id, { used: true });

    console.log(`Email verified for ${email}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error verifying code:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});