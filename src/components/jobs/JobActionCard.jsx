import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Camera, Loader2, AlertTriangle, RefreshCw, DollarSign, Play, Clock } from 'lucide-react';
import JobReviewForm from './JobReviewForm';

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(null);
  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();
    const calc = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setTimeLeft({ expired: true }); return; }
      setTimeLeft({
        expired: false,
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
  }, [targetDate]);
  return timeLeft;
}

export default function JobActionCard({ job, user, conversationId, onJobUpdated }) {
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [proofNote, setProofNote] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeFile, setDisputeFile] = useState(null);
  const [disputePreview, setDisputePreview] = useState(null);
  const [partialAmount, setPartialAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showProofForm, setShowProofForm] = useState(false);

  const isAvatar = user?.email === job?.winner_email;
  const isClient = user?.email === job?.posted_by_email;

  // Build scheduled datetime string
  const scheduledStr = job?.scheduled_date
    ? job.scheduled_time
      ? `${job.scheduled_date}T${job.scheduled_time}`
      : `${job.scheduled_date}T09:00`
    : null;

  const countdown = useCountdown(scheduledStr && job?.status === 'in_progress' && !job?.started_at ? scheduledStr : null);

  const postSystemMessage = async (content) => {
    await base44.entities.Message.create({
      conversation_id: conversationId,
      sender_email: 'system',
      sender_name: 'CoTask',
      content,
      message_type: 'system',
    });
    await base44.entities.Conversation.update(conversationId, {
      last_message: content,
      last_message_at: new Date().toISOString(),
      last_message_by: 'system',
    });
  };

  const notify = async (email, title, message, type = 'system') => {
    await base44.entities.Notification.create({
      user_email: email, title, message, type,
      link: `/Messages?conversation=${conversationId}`,
      reference_id: job.id,
    });
  };

  // ─── Avatar: Start Job ───
  const handleStartJob = async () => {
    setLoading(true);
    const now = new Date().toISOString();
    await base44.entities.JobPost.update(job.id, { started_at: now });
    const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    await postSystemMessage(`🚀 Job started at ${timeStr} by ${user.full_name}. The clock is running!`);
    await notify(job.posted_by_email, '🚀 Job has started!', `${user.full_name} has started working on your job.`, 'booking_accepted');
    setLoading(false);
    onJobUpdated?.();
  };

  // ─── Avatar: Submit proof ───
  const handleJobDone = async () => {
    if (!proofFile) return;
    setLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: proofFile });
    const now = new Date().toISOString();
    const startedAt = job.started_at ? new Date(job.started_at) : null;
    const endedAt = new Date(now);
    const durationMins = startedAt ? Math.round((endedAt - startedAt) / 60000) : null;
    const durationStr = durationMins != null
      ? durationMins >= 60
        ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
        : `${durationMins}m`
      : null;

    await base44.entities.JobPost.update(job.id, {
      status: 'awaiting_approval',
      proof_url: file_url,
      proof_note: proofNote,
      ended_at: now,
    });

    const summary = [
      `✅ Job marked as done by ${user.full_name}.`,
      startedAt ? `⏱ Started: ${startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : null,
      durationStr ? `⏳ Duration: ${durationStr}` : null,
      proofNote ? `📝 Note: "${proofNote}"` : null,
      `📸 Proof photo uploaded. Awaiting client review.`,
    ].filter(Boolean).join('\n');

    await postSystemMessage(summary);
    await notify(job.posted_by_email, '📸 Job Done — Please Review', `${user.full_name} has completed the job. Please review the proof and release payment.`, 'booking_accepted');
    setLoading(false);
    onJobUpdated?.();
  };

  // ─── Client: Satisfied ───
  const handleSatisfied = async () => {
    setLoading(true);
    await base44.entities.JobPost.update(job.id, { status: 'completed' });
    await postSystemMessage(`🎉 Client confirmed satisfaction! Job is complete and payment released to ${job.winner_email}. Thank you both!`);
    await notify(job.winner_email, '💰 Payment Released!', `${user.full_name} is satisfied with your work. Payment released!`, 'payment');
    setLoading(false);
    onJobUpdated?.();
  };

  // ─── Client: Dispute ───
  const handleDispute = async () => {
    if (!disputeReason) return;
    setLoading(true);
    let disputePhotoUrl = null;
    if (disputeFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: disputeFile });
      disputePhotoUrl = file_url;
    }
    await base44.entities.JobPost.update(job.id, { status: 'disputed', dispute_reason: disputeReason, dispute_photo_url: disputePhotoUrl || undefined });
    await postSystemMessage(`⚠️ Client raised a dispute: "${disputeReason}"${disputePhotoUrl ? ' (photo attached)' : ''}. The avatar can now respond.`);
    await notify(job.winner_email, '⚠️ Dispute Raised', `${user.full_name} raised a dispute. Please respond in the chat.`, 'system');
    setLoading(false);
    setShowDisputeForm(false);
    onJobUpdated?.();
  };

  const handleFullRefund = async () => {
    setLoading(true);
    await base44.entities.JobPost.update(job.id, { status: 'refunded' });
    await postSystemMessage(`↩️ Avatar agreed to a full refund. Job closed.`);
    await notify(job.posted_by_email, '↩️ Full Refund Agreed', `The avatar agreed to refund you in full.`, 'payment');
    setLoading(false);
    onJobUpdated?.();
  };

  const handlePartialRefund = async () => {
    if (!partialAmount) return;
    setLoading(true);
    await base44.entities.JobPost.update(job.id, { status: 'completed', partial_amount: Number(partialAmount) });
    await postSystemMessage(`🤝 Partial settlement agreed: Client pays $${partialAmount}. Both parties accepted.`);
    await notify(job.posted_by_email, '🤝 Partial Settlement', `The avatar proposed a partial payment of $${partialAmount}.`, 'payment');
    setLoading(false);
    onJobUpdated?.();
  };

  const handleRaiseIssue = async () => {
    setLoading(true);
    await base44.entities.JobPost.update(job.id, { status: 'disputed' });
    await postSystemMessage(`🚨 Dispute escalated to CoTask team. A team member will review within 24–48 hours.`);
    await base44.entities.Notification.create({ user_email: 'admin', title: '🚨 Escalated Dispute', message: `Job "${job.title}" escalated dispute.`, type: 'system', link: '/AdminDashboard', reference_id: job.id });
    await notify(job.posted_by_email, '🚨 Dispute Escalated', 'Your dispute has been escalated to CoTask team.', 'system');
    setLoading(false);
    onJobUpdated?.();
  };

  if (!job) return null;

  // ─── IN_PROGRESS: Countdown / Start Job / Mark Done ───
  if (job.status === 'in_progress') {
    if (!job.started_at) {
      // ── AVATAR: countdown then Start Job ──
      if (isAvatar) {
        const hasSchedule = !!scheduledStr;
        const timerRunning = hasSchedule && countdown && !countdown.expired;
        const timerExpiredOrNoSchedule = !hasSchedule || (countdown && countdown.expired);

        if (timerRunning) {
          return (
            <div className="mx-4 my-3 glass rounded-2xl p-5 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Job starts in</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[{ label: 'Days', v: countdown.days }, { label: 'Hours', v: countdown.hours }, { label: 'Mins', v: countdown.minutes }, { label: 'Secs', v: countdown.seconds }].map(u => (
                  <div key={u.label} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <div className="text-2xl font-bold tabular-nums">{String(u.v).padStart(2, '0')}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{u.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">You'll be able to start the job when the timer reaches zero.</p>
            </div>
          );
        }

        if (timerExpiredOrNoSchedule) {
          return (
            <div className="mx-4 my-3 glass rounded-2xl p-4 border border-green-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-green-400" />
                <p className="font-semibold text-sm text-green-400">It's time! Start your job</p>
              </div>
              <p className="text-xs text-muted-foreground">Click below to officially start the job and notify your client.</p>
              <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={handleStartJob} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4" /> Start Job Now</>}
              </Button>
            </div>
          );
        }

        return null; // countdown loading
      }

      // ── CLIENT: waiting view ──
      if (isClient) {
        return (
          <div className="mx-4 my-3 glass rounded-2xl p-5 border border-primary/20 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">
                {scheduledStr && countdown && !countdown.expired ? 'Job starts in' : 'Waiting for avatar to start…'}
              </span>
            </div>
            {scheduledStr && countdown && !countdown.expired && (
              <div className="grid grid-cols-4 gap-2">
                {[{ label: 'Days', v: countdown.days }, { label: 'Hours', v: countdown.hours }, { label: 'Mins', v: countdown.minutes }, { label: 'Secs', v: countdown.seconds }].map(u => (
                  <div key={u.label} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <div className="text-2xl font-bold tabular-nums">{String(u.v).padStart(2, '0')}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{u.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      return null;
    }

    // Job started — avatar sees subtle Mark Done, client sees in-progress banner
    if (isAvatar) {
      if (!showProofForm) {
        return (
          <div className="mx-4 my-3 flex justify-center">
            <button
              onClick={() => setShowProofForm(true)}
              className="text-xs text-muted-foreground hover:text-foreground border border-white/10 hover:border-primary/30 px-4 py-2 rounded-full transition-all gap-2 flex items-center"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Mark Job as Done
            </button>
          </div>
        );
      }
      return (
        <div className="mx-4 my-3 glass rounded-2xl p-4 border border-primary/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              <p className="font-semibold text-sm">Submit Completion Proof</p>
            </div>
            <button onClick={() => setShowProofForm(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
          <p className="text-xs text-muted-foreground">Upload a photo proof. The client will review and release payment.</p>
          {proofPreview ? (
            <div>
              <img src={proofPreview} alt="Proof" className="w-full max-h-40 object-cover rounded-xl border border-white/10" />
              <button type="button" onClick={() => { setProofPreview(null); setProofFile(null); }} className="text-xs text-muted-foreground hover:text-foreground mt-1">Remove photo</button>
            </div>
          ) : (
            <label className="w-full border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors cursor-pointer">
              <input type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setProofFile(f); setProofPreview(URL.createObjectURL(f)); } e.target.value = ''; }} />
              <Camera className="w-6 h-6 text-primary" />
              <span className="text-xs text-muted-foreground text-center">Tap to take a photo or upload from gallery</span>
            </label>
          )}
          <textarea value={proofNote} onChange={e => setProofNote(e.target.value)} rows={2} placeholder="Optional note about the completed work…"
            className="w-full text-sm bg-muted/50 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground resize-none" />
          <Button className="w-full gap-2" onClick={handleJobDone} disabled={!proofFile || loading}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><CheckCircle className="w-4 h-4" /> Submit Proof & Mark Done</>}
          </Button>
        </div>
      );
    }

    if (isClient) {
      return (
        <div className="mx-4 my-3 glass rounded-2xl p-3 border border-green-500/20 flex items-center gap-2">
          <Play className="w-4 h-4 text-green-400" />
          <p className="text-sm text-green-400 font-medium">Job is in progress — avatar is working on it.</p>
        </div>
      );
    }

    return null;
  }

  // ─── AWAITING APPROVAL ───
  if (job.status === 'awaiting_approval') {
    if (isClient) {
      return (
        <div className="mx-4 my-3 glass rounded-2xl p-4 border border-yellow-500/30 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <p className="font-semibold text-sm text-yellow-400">Job Completion — Your Review Needed</p>
          </div>
          <p className="text-xs text-muted-foreground">The avatar has marked this job as done. Review the proof and confirm.</p>
          {job.proof_url && <img src={job.proof_url} alt="Proof" className="w-full max-h-48 object-cover rounded-xl border border-white/10" />}
          {job.proof_note && <p className="text-xs text-muted-foreground italic">"{job.proof_note}"</p>}
          {!showDisputeForm ? (
            <div className="flex gap-2">
              <Button className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white" onClick={handleSatisfied} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Satisfied — Release Payment</>}
              </Button>
              <Button variant="outline" className="flex-1 gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => setShowDisputeForm(true)} disabled={loading}>
                <XCircle className="w-4 h-4" /> Not Satisfied
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium text-red-400">Explain why you're not satisfied:</p>
              <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} rows={3}
                placeholder="Describe what went wrong…"
                className="w-full text-sm bg-muted/50 border border-white/5 rounded-xl px-3 py-2 focus:outline-none text-foreground placeholder:text-muted-foreground resize-none" />
              {disputePreview ? (
                <div>
                  <img src={disputePreview} alt="Dispute" className="w-full max-h-32 object-cover rounded-xl border border-white/10" />
                  <button onClick={() => { setDisputePreview(null); setDisputeFile(null); }} className="text-xs text-muted-foreground mt-1">Remove</button>
                </div>
              ) : (
                <label className="w-full border border-dashed border-white/10 rounded-xl p-3 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) { setDisputeFile(f); setDisputePreview(URL.createObjectURL(f)); } e.target.value = ''; }} />
                  <Camera className="w-4 h-4" /> Attach photo evidence (optional)
                </label>
              )}
              <div className="flex gap-2">
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-1.5" onClick={handleDispute} disabled={!disputeReason || loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><AlertTriangle className="w-4 h-4" /> Submit Dispute</>}
                </Button>
                <Button variant="outline" className="border-white/10" onClick={() => setShowDisputeForm(false)} disabled={loading}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      );
    }
    if (isAvatar) {
      return (
        <div className="mx-4 my-3 glass rounded-2xl p-3 border border-yellow-500/20 flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
          <p className="text-sm text-yellow-400 font-medium">Proof submitted — waiting for client to review and release payment.</p>
        </div>
      );
    }
  }

  // ─── DISPUTED ───
  if (isAvatar && job.status === 'disputed') {
    return (
      <div className="mx-4 my-3 glass rounded-2xl p-4 border border-orange-500/30 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          <p className="font-semibold text-sm text-orange-400">Dispute — Choose a Resolution</p>
        </div>
        {job.dispute_reason && <p className="text-xs italic text-muted-foreground">Client's reason: "{job.dispute_reason}"</p>}
        {job.dispute_photo_url && <img src={job.dispute_photo_url} alt="Dispute" className="w-full max-h-32 object-cover rounded-xl border border-white/10" />}
        <div className="space-y-2">
          <Button variant="outline" className="w-full gap-2 border-green-500/30 text-green-400 hover:bg-green-500/10" onClick={handleFullRefund} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Give Full Refund</>}
          </Button>
          <div className="flex gap-2">
            <input type="number" value={partialAmount} onChange={e => setPartialAmount(e.target.value)} placeholder="Partial amount ($)"
              className="flex-1 bg-muted/50 border border-white/5 rounded-xl px-3 py-2 text-sm focus:outline-none text-foreground placeholder:text-muted-foreground" />
            <Button variant="outline" className="gap-1.5 border-blue-500/30 text-blue-400 hover:bg-blue-500/10" onClick={handlePartialRefund} disabled={!partialAmount || loading}>
              <DollarSign className="w-4 h-4" /> Partial
            </Button>
          </div>
          <Button variant="outline" className="w-full gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={handleRaiseIssue} disabled={loading}>
            <AlertTriangle className="w-4 h-4" /> Escalate to CoTask Team
          </Button>
        </div>
      </div>
    );
  }

  // ─── COMPLETED or REFUNDED → Reviews ───
  if (job.status === 'completed' || job.status === 'refunded') {
    const avatarReviewDone = job.review_left_by_avatar;
    const clientReviewDone = job.review_left_by_client;

    return (
      <div className="mx-4 my-3 glass rounded-2xl p-4 border border-green-500/20 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <p className="text-sm text-green-400 font-medium">
            {job.status === 'refunded' ? 'This job was refunded.' : isAvatar ? '💰 Payment released. Great work!' : '✓ Job completed. Payment released.'}
          </p>
        </div>
        {isAvatar && !avatarReviewDone && (
          <JobReviewForm job={job} user={user} reviewerType="avatar" onDone={onJobUpdated} />
        )}
        {isClient && !clientReviewDone && (
          <JobReviewForm job={job} user={user} reviewerType="client" onDone={onJobUpdated} />
        )}
        {((isAvatar && avatarReviewDone) || (isClient && clientReviewDone)) && (
          <p className="text-xs text-muted-foreground">✓ You've already left a review.</p>
        )}
      </div>
    );
  }

  return null;
}