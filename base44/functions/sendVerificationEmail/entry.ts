import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const { email } = await req.json();
    if (!email) return Response.json({ error: 'Email is required' }, { status: 400 });

    const base44 = createClientFromRequest(req);

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Remove any old codes for this email
    const existing = await base44.asServiceRole.entities.EmailVerification.filter({ email });
    for (const record of existing) {
      await base44.asServiceRole.entities.EmailVerification.delete(record.id);
    }

    // Create new verification record
    await base44.asServiceRole.entities.EmailVerification.create({
      email,
      code,
      expires_at: expiresAt,
      used: false,
    });

    // Send email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: '🔐 Your CoTask verification code',
      body: `Hi there!\n\nYour CoTask email verification code is:\n\n  ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\n— The CoTask Team`,
    });

    console.log(`Verification code sent to ${email}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending verification email:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});