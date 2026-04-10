import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id_photo_url, selfie_url, profile_id, profile_type, session_id } = await req.json();

  if (!id_photo_url || !selfie_url) {
    return Response.json({ error: 'Both id_photo_url and selfie_url are required' }, { status: 400 });
  }

  // Use AI vision to verify identity
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are an identity verification expert. You are given two images:
1. An identity document (passport, driving licence, national ID card, etc.)
2. A selfie photo of a person

Please perform the following checks:
1. DOCUMENT CHECK: Is image 1 a valid-looking identity document? (not a blank paper, screenshot of a document, or clearly fake)
2. SELFIE CHECK: Is image 2 a clear selfie of a real person's face? (not a photo of a photo, cartoon, or obscured face)
3. FACE MATCH: Does the face in the selfie appear to match the face on the identity document?
4. NAME EXTRACTION: If visible, what is the full name on the document?
5. DOCUMENT TYPE: What type of document is it? (passport, driving_licence, national_id, other, unknown)

Be strict but fair. Minor lighting differences are acceptable. Return your analysis.`,
    file_urls: [id_photo_url, selfie_url],
    model: 'claude_sonnet_4_6',
    response_json_schema: {
      type: 'object',
      properties: {
        is_valid_document: { type: 'boolean' },
        is_valid_selfie: { type: 'boolean' },
        faces_match: { type: 'boolean' },
        confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        full_name: { type: 'string' },
        document_type: { type: 'string' },
        rejection_reasons: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' }
      }
    }
  });

  const passed = result.is_valid_document && result.is_valid_selfie && result.faces_match;
  const verificationStatus = passed ? 'verified' : 'rejected';

  // Update the relevant profile
  if (profile_id && profile_type) {
    if (profile_type === 'avatar') {
      await base44.asServiceRole.entities.AvatarProfile.update(profile_id, {
        verification_status: verificationStatus,
        is_verified: passed
      });
    } else if (profile_type === 'enterprise') {
      await base44.asServiceRole.entities.EnterpriseProfile.update(profile_id, {
        verification_status: verificationStatus
      });
    }
  }

  // Also update the user record
  await base44.asServiceRole.entities.User.update(user.id, {
    identity_verified: passed,
    identity_verification_status: verificationStatus
  });

  const finalResult = {
    success: passed,
    status: verificationStatus,
    confidence: result.confidence,
    full_name: result.full_name,
    document_type: result.document_type,
    rejection_reasons: result.rejection_reasons || [],
    notes: result.notes
  };

  // If this was triggered from a mobile QR session, store result so desktop can poll it
  if (session_id) {
    await base44.asServiceRole.entities.VerificationSession.create({
      session_id,
      result: finalResult
    });
  }

  return Response.json(finalResult);
});