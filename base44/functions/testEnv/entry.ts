import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Don't check user, just try to create with the current token (which is null, so it's public role)
    // Wait, if RLS is true, public can create. Let's try.
    const job = await base44.entities.JobPost.create({
      title: "Test",
      description: "Test Desc",
      category: "Cleaning",
      posted_by_email: "test@example.com",
      posted_by_name: "Test User",
      posted_by_type: "user",
      status: "open",
      application_count: 0
    });

    return Response.json({ success: true, job });
  } catch (error) {
    return Response.json({ error: error.message, details: error.response?.data }, { status: 500 });
  }
});