import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { task_type, task_id } = await req.json();
    if (!task_type || !task_id) return Response.json({ error: 'Missing task_type or task_id' }, { status: 400 });

    let task;
    if (task_type === 'booking') {
      const records = await base44.asServiceRole.entities.Booking.filter({ id: task_id });
      if (!records.length) return Response.json({ error: 'Not found' }, { status: 404 });
      task = records[0];
      if (user.role !== 'admin' && task.client_email !== user.email) return Response.json({ error: 'Unauthorized' }, { status: 403 });
    } else if (task_type === 'job') {
      const records = await base44.asServiceRole.entities.JobPost.filter({ id: task_id });
      if (!records.length) return Response.json({ error: 'Not found' }, { status: 404 });
      task = records[0];
      if (user.role !== 'admin' && task.posted_by_email !== user.email) return Response.json({ error: 'Unauthorized' }, { status: 403 });
    } else {
      return Response.json({ error: 'Invalid task_type' }, { status: 400 });
    }

    if (task.payment_status !== 'held') {
      return Response.json({ error: 'Payment is not in held status' }, { status: 400 });
    }

    const platformFeePercentage = 15;
    const amount = task.total_amount || task.amount || task.total_budget || task.budget || 0;
    const platformFeeAmount = amount * (platformFeePercentage / 100);
    const agentNetAmount = amount - platformFeeAmount;
    const avatarEmail = task_type === 'job' ? task.winner_email : task.avatar_email;

    if (task_type === 'booking') {
      await base44.asServiceRole.entities.Booking.update(task_id, {
        payment_status: 'released',
        released_at: new Date().toISOString()
      });
    } else if (task_type === 'job') {
      await base44.asServiceRole.entities.JobPost.update(task_id, {
        payment_status: 'released',
        released_at: new Date().toISOString()
      });
    }

    if (avatarEmail) {
      const profiles = await base44.asServiceRole.entities.AvatarProfile.filter({ user_email: avatarEmail });
      if (profiles.length) {
        const profile = profiles[0];
        const newTotal = (profile.total_earnings || 0) + agentNetAmount;
        await base44.asServiceRole.entities.AvatarProfile.update(profile.id, {
          total_earnings: newTotal
        });
      }

      await base44.asServiceRole.entities.Notification.create({
        user_email: avatarEmail,
        title: 'Task approved — earnings updated',
        message: `Your task for ${task.client_name || task.client_email} was approved. Your earnings have been credited.`,
        type: 'payment',
        link: '/AvatarWallet'
      });
    }

    await base44.asServiceRole.entities.Notification.create({
      user_email: task.client_email || task.posted_by_email,
      title: 'Task completed',
      message: `Your task payment has been securely released.`,
      type: 'payment',
      link: task_type === 'booking' ? `/UserBookingDetail?id=${task_id}` : `/JobDetail?id=${task_id}`
    });

    return Response.json({ success: true, payment_status: 'released', agent_net_amount: agentNetAmount });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});