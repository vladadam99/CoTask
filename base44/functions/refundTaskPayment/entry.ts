import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - admin only' }, { status: 403 });
    }

    const { task_type, task_id, amount, reason } = await req.json();
    if (!task_type || !task_id || !reason) return Response.json({ error: 'Missing required fields' }, { status: 400 });

    let task;
    if (task_type === 'booking') {
      const records = await base44.asServiceRole.entities.Booking.filter({ id: task_id });
      if (!records.length) return Response.json({ error: 'Not found' }, { status: 404 });
      task = records[0];
    } else if (task_type === 'job') {
      const records = await base44.asServiceRole.entities.JobPost.filter({ id: task_id });
      if (!records.length) return Response.json({ error: 'Not found' }, { status: 404 });
      task = records[0];
    } else {
      return Response.json({ error: 'Invalid task_type' }, { status: 400 });
    }

    if (!task.stripe_payment_intent_id) {
      return Response.json({ error: 'No Stripe Payment Intent found for this task' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    
    const refundParams = {
      payment_intent: task.stripe_payment_intent_id,
      reason: 'requested_by_customer'
    };
    
    if (amount) {
      refundParams.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundParams);

    const newStatus = amount && amount < (task.total_amount || task.amount || task.escrow_amount || task.budget_min || 0) 
      ? 'partially_refunded' 
      : 'refunded';

    if (task_type === 'booking') {
      await base44.asServiceRole.entities.Booking.update(task_id, { payment_status: newStatus });
    } else if (task_type === 'job') {
      await base44.asServiceRole.entities.JobPost.update(task_id, { payment_status: newStatus });
    }

    await base44.asServiceRole.entities.Notification.create({
      user_email: task.client_email || task.posted_by_email,
      title: 'Payment Refunded',
      message: `Your task payment has been refunded. Reason: ${reason}`,
      type: 'payment',
      link: task_type === 'booking' ? `/UserBookingDetail?id=${task_id}` : `/JobDetail?id=${task_id}`
    });

    const avatarEmail = task.avatar_email || task.assigned_to_email;
    if (avatarEmail) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: avatarEmail,
        title: 'Task Payment Refunded',
        message: `A payment for a task was refunded to the client. Reason: ${reason}`,
        type: 'payment',
        link: task_type === 'booking' ? `/AvatarBookingDetail?id=${task_id}` : `/JobDetail?id=${task_id}`
      });
    }

    return Response.json({ success: true, refund_id: refund.id, status: newStatus });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});