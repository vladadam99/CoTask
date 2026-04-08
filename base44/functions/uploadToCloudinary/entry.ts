import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, resource_type = 'auto' } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url is required' }, { status: 400 });

    const cloudName = 'dllyfrdpr';
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    // Build signed upload params
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `timestamp=${timestamp}`;

    // Generate SHA1 signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(apiSecret);
    const msgData = encoder.encode(`${paramsToSign}${apiSecret}`);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Upload to Cloudinary via URL
    const formData = new FormData();
    formData.append('file', file_url);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('resource_type', resource_type);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resource_type}/upload`,
      { method: 'POST', body: formData }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Cloudinary error:', result);
      return Response.json({ error: result.error?.message || 'Upload failed' }, { status: 500 });
    }

    return Response.json({
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height,
      duration: result.duration,
    });

  } catch (error) {
    console.error('uploadToCloudinary error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});