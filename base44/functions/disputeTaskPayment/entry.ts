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
    const records = await base44.asServiceRole.entities[collection].filter({ id: task_id });
    if (!records.length) return Response.json({ error: 'Task not found' }, { status: 404 });
    const task = records[0];

    let clientEmail, avatarEmail;
    if (task_type === 'job') {
      clientEmail = task.posted_by_email;
      avatarEmail = task.winner_email || task.assigned_to_email;
    } else {
      clientEmail = task.client_email;
      avatarEmail = task.avatar_email;
    }

    if (clientEmail !== user.email && avatarEmail !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Mark as disputed
    await base44.asServiceRole.entities[collection].update(task_id, {
      status: 'disputed',
      payment_status: 'disputed',
      dispute_reason: dispute_reason
    });

    // Notify the other party if there is an avatar assigned
    if (avatarEmail) {
      const targetEmail = user.email === clientEmail ? avatarEmail : clientEmail;
      const targetRole = user.email === clientEmail ? 'avatar' : 'user';
      
      await base44.asServiceRole.entities.Notification.create({
        user_email: targetEmail,
        title: 'Payment Disputed',
        message: `${user.full_name || 'The other party'} has opened a dispute on the secure payment. Reason: ${dispute_reason}`,
        type: 'system',
        target_role: targetRole,
        link: task_type === 'job' ? `/JobDetail?id=${task_id}` : `/UserBookingDetail?id=${task_id}`
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});