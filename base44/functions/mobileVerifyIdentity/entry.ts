import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// This function is called from mobile without user auth
// It stores the verification result in VerificationSession for the desktop to poll
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { id_photo_url, selfie_url, session_id, registered_name } = await req.json();

  if (!id_photo_url || !selfie_url || !session_id) {
    return Response.json({ error: 'id_photo_url, selfie_url and session_id are required' }, { status: 400 });
  }

  // Run AI identity verification
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are a strict identity verification system. You are given two images:
- Image 1: should be a government-issued photo ID document (passport, driving licence, national ID card)
- Image 2: should be a selfie of the person holding or presenting themselves

The person's registered account name is: "${registered_name || 'unknown'}"

You MUST apply ALL of the following strict rules and REJECT if ANY fail:

DOCUMENT CHECKS (Image 1):
- REJECT if Image 1 is NOT a physical ID document (e.g. if it is a selfie, a face, a random object, a table, a wall, or anything other than an ID card/passport/licence)
- REJECT if the document does not have visible text fields (name, date of birth, expiry, document number etc.)
- REJECT if the document does not have a photo of a person embedded in it
- REJECT if the document appears to be expired, damaged beyond readability, or clearly fake
- The document MUST look like an official government-issued identity document

SELFIE CHECKS (Image 2):
- REJECT if Image 2 does not clearly show a human face looking at the camera
- REJECT if it is blurry, dark, or the face is obstructed

FACE MATCH:
- REJECT if the face in Image 2 does not plausibly match the face printed on the ID document in Image 1
- You must compare facial features: eye spacing, nose shape, jawline, overall structure

NAME MATCH:
- Read the full name printed on the ID document
- REJECT if the name on the document does not match the registered account name ("${registered_name || 'unknown'}") — minor spelling differences or middle name omissions are acceptable, but the first and last name must clearly correspond
- If registered_name is "unknown", skip this check

If Image 1 is CLEARLY not an ID document (it looks like a selfie/face/random photo), set is_valid_document=false and add "Image 1 does not appear to be an identity document" to rejection_reasons.

Be very strict. False positives are worse than false negatives.`,
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
        name_matches: { type: 'boolean' },
        rejection_reasons: { type: 'array', items: { type: 'string' } },
        notes: { type: 'string' }
      }
    }
  });

  const passed = result.is_valid_document && result.is_valid_selfie && result.faces_match && (registered_name ? result.name_matches : true);

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