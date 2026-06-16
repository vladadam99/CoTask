import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const body = await req.text();

  let event;
  try {
    if (webhookSecret && sig) {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'identity.verification_session.verified') {
    const verificationSession = event.data.object;
    const userEmail = verificationSession.metadata?.user_email;
    const profileId = verificationSession.metadata?.profile_id;
    const profileType = verificationSession.metadata?.profile_type;

    if (userEmail) {
      try {
        const base44 = createClientFromRequest(req);

        // Update user record
        const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            identity_verified: true,
            identity_verification_status: 'verified',
          });
        }

        // Update avatar or enterprise profile
        if (profileId && profileType === 'avatar') {
          await base44.asServiceRole.entities.AvatarProfile.update(profileId, {
            is_verified: true,
            verification_status: 'verified',
          });
        } else if (profileId && profileType === 'enterprise') {
          await base44.asServiceRole.entities.EnterpriseProfile.update(profileId, {
            is_verified: true,
            verification_status: 'verified',
          });
        }

        // Create notification
        await base44.asServiceRole.entities.Notification.create({
          user_email: userEmail,
          title: 'Identity Verified!',
          message: 'Your identity has been successfully verified. You now have full access to all platform features.',
          type: 'system',
          link: '/UserSettings',
        });

        console.log(`Identity verified for user: ${userEmail}`);
      } catch (err) {
        console.error('Failed to update verification status:', err.message);
      }
    }
    return Response.json({ received: true });
  }

  if (event.type === 'identity.verification_session.requires_input') {
    const verificationSession = event.data.object;
    const userEmail = verificationSession.metadata?.user_email;
    if (userEmail) {
      try {
        const base44 = createClientFromRequest(req);
        const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            identity_verification_status: 'rejected',
          });
        }
        console.log(`Identity verification failed for user: ${userEmail}`);
      } catch (err) {
        console.error('Failed to update rejected status:', err.message);
      }
    }
    return Response.json({ received: true });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const taskType = session.metadata?.task_type;
    const taskId = session.metadata?.task_id || session.metadata?.booking_id;
    const paymentIntentId = session.payment_intent;
    
    if (!taskId) {
      console.warn('No task_id in session metadata');
      return Response.json({ received: true });
    }

    try {
      const base44 = createClientFromRequest(req);
      
      const updateData = {
        payment_status: 'held',
        stripe_payment_intent_id: paymentIntentId
      };

      let clientEmail = '';
      let avatarEmail = '';

      if (taskType === 'job') {
        const jobs = await base44.asServiceRole.entities.JobPost.filter({ id: taskId });
        if (jobs.length > 0 && jobs[0].payment_status !== 'held') {
          await base44.asServiceRole.entities.JobPost.update(taskId, updateData);
          clientEmail = jobs[0].posted_by_email;
          avatarEmail = jobs[0].assigned_to_email;
        }
      } else {
        // Default to booking
        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: taskId });
        if (bookings.length > 0 && bookings[0].payment_status !== 'held') {
          await base44.asServiceRole.entities.Booking.update(taskId, updateData);
          clientEmail = bookings[0].client_email;
          avatarEmail = bookings[0].avatar_email;
          
          // Auto-create conversation if none exists
          const convos = await base44.asServiceRole.entities.Conversation.filter({ booking_id: taskId });
          if (convos.length === 0) {
            await base44.asServiceRole.entities.Conversation.create({
              participant_emails: [clientEmail, avatarEmail],
              participant_names: [bookings[0].client_name, bookings[0].avatar_name],
              booking_id: taskId,
              last_message: 'Secure Payment Held. Say hello!',
              last_message_at: new Date().toISOString(),
              last_message_by: 'system',
              unread_by: [clientEmail, avatarEmail],
            });
          }
        }
      }

      if (clientEmail) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: clientEmail,
          title: 'Secure Payment Held',
          message: 'Your payment was successful and is securely held until task approval.',
          type: 'payment'
        });
      }
      
      if (avatarEmail) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: avatarEmail,
          title: 'Secure Payment Held',
          message: 'The client has securely funded the task. It is safe to proceed.',
          type: 'payment'
        });
      }

      console.log(`Task ${taskId} marked as held.`);
    } catch (err) {
      console.error('Failed to update task after checkout completion:', err.message);
    }
  }

  if (event.type === 'payment_intent.payment_failed' || event.type === 'checkout.session.async_payment_failed') {
    // Handle failed payments
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object;
    const paymentIntentId = charge.payment_intent;
    if (paymentIntentId) {
      try {
        const base44 = createClientFromRequest(req);
        // Find booking or job with this payment intent
        const bookings = await base44.asServiceRole.entities.Booking.filter({ stripe_payment_intent_id: paymentIntentId });
        if (bookings.length > 0) {
          await base44.asServiceRole.entities.Booking.update(bookings[0].id, { payment_status: 'refunded' });
        } else {
          const jobs = await base44.asServiceRole.entities.JobPost.filter({ stripe_payment_intent_id: paymentIntentId });
          if (jobs.length > 0) {
            await base44.asServiceRole.entities.JobPost.update(jobs[0].id, { payment_status: 'refunded' });
          }
        }
      } catch(err) {
        console.error('Failed to process refund:', err.message);
      }
    }
  }

  if (event.type === 'charge.dispute.created') {
    const charge = event.data.object;
    const paymentIntentId = charge.payment_intent;
    if (paymentIntentId) {
      try {
        const base44 = createClientFromRequest(req);
        const bookings = await base44.asServiceRole.entities.Booking.filter({ stripe_payment_intent_id: paymentIntentId });
        if (bookings.length > 0) {
          await base44.asServiceRole.entities.Booking.update(bookings[0].id, { payment_status: 'disputed' });
        } else {
          const jobs = await base44.asServiceRole.entities.JobPost.filter({ stripe_payment_intent_id: paymentIntentId });
          if (jobs.length > 0) {
            await base44.asServiceRole.entities.JobPost.update(jobs[0].id, { payment_status: 'disputed' });
          }
        }
      } catch(err) {
        console.error('Failed to process dispute:', err.message);
      }
    }
  }

  return Response.json({ received: true });
});