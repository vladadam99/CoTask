import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { task_type, task_id, success_url, cancel_url } = await req.json();
    if (!task_type || !task_id) return Response.json({ error: 'Missing task_type or task_id' }, { status: 400 });

    let amount = 0;
    let currency = 'USD';
    let title = '';
    let clientEmail = '';
    let avatarEmail = '';

    if (task_type === 'booking') {
      const bookings = await base44.asServiceRole.entities.Booking.filter({ id: task_id });
      if (!bookings.length) return Response.json({ error: 'Booking not found' }, { status: 404 });
      const booking = bookings[0];
      if (user.role !== 'admin' && booking.client_email !== user.email) {
        return Response.json({ error: 'Unauthorized for this booking' }, { status: 403 });
      }
      if (booking.status === 'pending') {
        return Response.json({ error: 'Cannot pay for a pending booking. Wait for the agent to accept.' }, { status: 400 });
      }
      if (['held', 'released', 'paid'].includes(booking.payment_status)) {
        return Response.json({ error: 'Booking is already paid' }, { status: 400 });
      }
      amount = booking.total_amount;
      currency = booking.currency || 'USD';
      title = `Booking: ${booking.category || 'Service'}`;
      clientEmail = booking.client_email;
      avatarEmail = booking.avatar_email;
      
      await base44.asServiceRole.entities.Booking.update(task_id, {
        payment_status: 'checkout_started'
      });
    } else if (task_type === 'job') {
      const jobs = await base44.asServiceRole.entities.JobPost.filter({ id: task_id });
      if (!jobs.length) return Response.json({ error: 'Job not found' }, { status: 404 });
      const job = jobs[0];
      if (user.role !== 'admin' && job.posted_by_email !== user.email) {
        return Response.json({ error: 'Unauthorized for this job' }, { status: 403 });
      }
      if (job.status === 'open' || !job.winner_email) {
        return Response.json({ error: 'Cannot pay for an open task without a selected agent.' }, { status: 400 });
      }
      if (['held', 'released', 'paid'].includes(job.payment_status)) {
        return Response.json({ error: 'Job is already paid' }, { status: 400 });
      }
      amount = job.total_budget || job.budget || 0; // Assuming total_budget exists
      currency = job.currency || 'USD';
      title = `Job: ${job.title || 'Task'}`;
      clientEmail = job.posted_by_email;
      avatarEmail = job.assigned_to_email || ''; // Might not be assigned directly in fields, but we pass what we have
      
      await base44.asServiceRole.entities.JobPost.update(task_id, {
        payment_status: 'checkout_started'
      });
    } else {
      return Response.json({ error: 'Invalid task_type' }, { status: 400 });
    }

    if (!amount) return Response.json({ error: 'Invalid amount' }, { status: 400 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const amountCents = Math.round(amount * 100);

    const platformFeePercentage = 15; // Example fee
    const platformFeeAmount = Math.round(amount * (platformFeePercentage / 100));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: title },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      success_url: success_url || `${req.headers.get('origin')}/Bookings`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/Bookings`,
      metadata: {
        task_type,
        task_id,
        client_email: clientEmail,
        avatar_email: avatarEmail,
        gross_amount: amount.toString(),
        platform_fee_amount: platformFeeAmount.toString(),
        environment: 'test'
      },
    });

    if (task_type === 'booking') {
      await base44.asServiceRole.entities.Booking.update(task_id, { stripe_checkout_session_id: session.id });
    } else if (task_type === 'job') {
      await base44.asServiceRole.entities.JobPost.update(task_id, { stripe_checkout_session_id: session.id });
    }

    return Response.json({ checkout_url: session.url, session_id: session.id, payment_status: 'checkout_started' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});