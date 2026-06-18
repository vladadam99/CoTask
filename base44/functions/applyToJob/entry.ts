import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { job_id, cover_message, ...rest } = payload;

    if (!job_id || !cover_message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const jobs = await base44.asServiceRole.entities.JobPost.filter({ id: job_id });
    if (!jobs.length) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }
    const job = jobs[0];

    if (job.posted_by_email === user.email) {
      return Response.json({ error: 'You cannot apply to your own job.' }, { status: 400 });
    }

    const existingApp = await base44.asServiceRole.entities.JobApplication.filter({
      job_id: job.id,
      applicant_email: user.email
    });
    if (existingApp.length > 0) {
      return Response.json({ error: 'You have already applied to this job.' }, { status: 400 });
    }

    const applicationData = {
      ...rest,
      job_id: job.id,
      job_title: job.title,
      applicant_email: user.email,
      applicant_name: user.full_name,
      client_email: job.posted_by_email,
      cover_message,
      status: 'pending'
    };

    const application = await base44.asServiceRole.entities.JobApplication.create(applicationData);

    await base44.asServiceRole.entities.Notification.create({
      user_email: job.posted_by_email,
      title: 'New Job Application',
      message: `${user.full_name} applied to your job "${job.title}".`,
      type: 'booking_request',
      link: `/JobDetail?id=${job.id}`,
      reference_id: job.id,
      target_role: 'user'
    });

    return Response.json({ success: true, application });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});