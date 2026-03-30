import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, name } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in entity with expiry (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    // Delete any existing codes for this email
    const existing = await base44.asServiceRole.entities.PendingVerification.filter({ email });
    for (const rec of existing) {
      await base44.asServiceRole.entities.PendingVerification.delete(rec.id);
    }

    // Create new code record
    await base44.asServiceRole.entities.PendingVerification.create({
      email,
      code,
      expires_at: expiresAt,
    });

    // Send email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: 'Your CoTask verification code',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f1117; color: #fff; padding: 40px; border-radius: 12px;">
          <h2 style="color: #fff; margin: 0 0 8px;">Hi ${name || 'there'} 👋</h2>
          <p style="color: #aaa; margin: 0 0 30px;">Use the code below to verify your CoTask account. It expires in 10 minutes.</p>
          <div style="background: #1a1f2e; border: 1px solid #333; border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 24px;">
            <p style="color: #aaa; font-size: 13px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
            <span style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #e8304a;">${code}</span>
          </div>
          <p style="color: #666; font-size: 12px; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    console.log(`Verification code sent to ${email}`);

    return Response.json({ success: true, code }); // returning code so frontend can verify locally too
  } catch (error) {
    console.error('Send verification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});