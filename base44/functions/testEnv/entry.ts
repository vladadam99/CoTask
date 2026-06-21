import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const job = await base44.entities.JobPost.create({
      title: "Test",
      description: "Test Desc",
      category: "Cleaning",
      posted_by_email: user.email,
      posted_by_name: user.full_name,
      posted_by_type: "user",
      status: "open",
      application_count: 0
    });

    return Response.json({ success: true, job });
  } catch (error) {
    return Response.json({ error: error.message, details: error.response?.data }, { status: 500 });
  }
});