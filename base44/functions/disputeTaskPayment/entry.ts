import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { task_type, task_id, dispute_reason } = await req.json();
    if (!task_type || !task_id || !dispute_reason) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const collection = task_type === 'job' ? 'JobPost' : 'Booking';
    const task = await base44.asServiceRole.entities[collection].get(task_id);
    if (!task) return Response.json({ error: 'Task not found' }, { status: 404 });

    if (task.client_email !== user.email && task.avatar_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Mark as disputed
    await base44.asServiceRole.entities[collection].update(task_id, {
      payment_status: 'disputed',
      dispute_reason: dispute_reason
    });

    // Notify the other party
    const targetEmail = user.email === task.client_email ? task.avatar_email : task.client_email;
    const targetRole = user.email === task.client_email ? 'avatar' : 'user';
    
    await base44.asServiceRole.entities.Notification.create({
      user_email: targetEmail,
      title: 'Payment Disputed',
      message: `${user.full_name} has opened a dispute on the secure payment. Reason: ${dispute_reason}`,
      type: 'system',
      target_role: targetRole,
      link: task_type === 'job' ? `/JobDetail?id=${task_id}` : `/UserBookingDetail?id=${task_id}`
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});