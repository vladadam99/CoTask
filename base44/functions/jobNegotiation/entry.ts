import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, refId, amount, note, offerId, isOwner, jobId, targetEmail, targetRole, accept, jobTitle, applicantEmail } = await req.json();

    if (action === 'create') {
      const offer = await base44.asServiceRole.entities.CounterOffer.create({
        booking_id: refId,
        offered_by_email: user.email,
        offered_by_name: user.full_name,
        offered_by_role: isOwner ? 'client' : 'avatar',
        amount,
        note,
        status: 'pending',
      });

      await base44.asServiceRole.entities.Notification.create({
        user_email: targetEmail,
        title: `${user.full_name} made a counter-offer on "${jobTitle}"`,
        message: `Proposed rate: $${amount.toFixed(2)}${note ? ` — "${note}"` : ''}`,
        type: 'booking_request',
        reference_id: jobId,
        link: `/JobDetail?id=${jobId}`,
        target_role: targetRole,
      });

      return Response.json({ success: true, offer });
    } else if (action === 'respond') {
      await base44.asServiceRole.entities.CounterOffer.update(offerId, { status: accept ? 'accepted' : 'declined' });

      if (accept) {
        // update application
        const apps = await base44.asServiceRole.entities.JobApplication.filter({ job_id: jobId, applicant_email: applicantEmail });
        if (apps.length > 0) {
          await base44.asServiceRole.entities.JobApplication.update(apps[0].id, { proposed_rate: amount });
        }

        await base44.asServiceRole.entities.Notification.create({
          user_email: targetEmail,
          title: `Rate of $${amount.toFixed(2)} accepted for "${jobTitle}"`,
          message: `${user.full_name} accepted your offer. Proceeding with payment.`,
          type: 'payment',
          reference_id: jobId,
          link: `/JobDetail?id=${jobId}`,
          target_role: targetRole,
        });
      } else {
        await base44.asServiceRole.entities.Notification.create({
          user_email: targetEmail,
          title: `Offer declined for "${jobTitle}"`,
          message: `${user.full_name} declined. You can propose a new rate.`,
          type: 'booking_request',
          reference_id: jobId,
          link: `/JobDetail?id=${jobId}`,
          target_role: targetRole,
        });
      }
      return Response.json({ success: true });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});