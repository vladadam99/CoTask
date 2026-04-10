import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// This function is called from mobile without user auth
// It stores the verification result in VerificationSession for the desktop to poll
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { id_photo_url, selfie_url, session_id } = await req.json();

  if (!id_photo_url || !selfie_url || !session_id) {
    return Response.json({ error: 'id_photo_url, selfie_url and session_id are required' }, { status: 400 });
  }

  // Run AI identity verification
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are an identity verification expert. You are given two images:
1. An identity document (passport, driving licence, national ID card, etc.)
2. A selfie photo of a person

Please perform the following checks:
1. DOCUMENT CHECK: Is image 1 a valid-looking identity document?
2. SELFIE CHECK: Is image 2 a clear selfie of a real person's face?
3. FACE MATCH: Does the face in the selfie appear to match the face on the identity document?
4. NAME EXTRACTION: If visible, what is the full name on the document?
5. DOCUMENT TYPE: What type of document is it? (passport, driving_licence, national_id, other, unknown)

Be strict but fair. Return your analysis.`,
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

  const finalResult = {
    success: passed,
    status: passed ? 'verified' : 'rejected',
    confidence: result.confidence,
    full_name: result.full_name,
    document_type: result.document_type,
    rejection_reasons: result.rejection_reasons || [],
    notes: result.notes
  };

  // Store result so desktop can poll for it
  await base44.asServiceRole.entities.VerificationSession.create({
    session_id,
    result: finalResult
  });

  return Response.json({ success: true, result: finalResult });
});