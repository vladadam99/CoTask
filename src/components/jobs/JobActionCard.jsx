import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Camera, Upload, Loader2, AlertTriangle, RefreshCw, DollarSign, ImagePlus } from 'lucide-react';

// Renders contextual action card inside the job conversation
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


  const isAvatar = user?.email === job?.winner_email;
  const isClient = user?.email === job?.posted_by_email;

  // ─── post a system message to the convo ───
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
      user_email: email,
      title,
      message,
      type,
      link: `/Messages?conversation=${conversationId}`,
      reference_id: job.id,
    });
  };

  // ─── Avatar: Mark job done + upload proof ───
  const handleJobDone = async () => {
    if (!proofFile) return;
    setLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: proofFile });
    await base44.entities.JobPost.update(job.id, {
      status: 'awaiting_approval',
      proof_url: file_url,
      proof_note: proofNote,
    });
    await postSystemMessage(`✅ Job marked as done by ${user.full_name}. Proof photo uploaded. ${proofNote ? `Note: "${proofNote}"` : ''} The client needs to review and release payment.`);
    await notify(job.posted_by_email, '📸 Job Done — Please Review', `${user.full_name} has completed the job and uploaded proof. Please review and release payment.`, 'booking_accepted');
    setLoading(false);
    onJobUpdated?.();
  };

  // ─── Client: Satisfied → release payment ───
  const handleSatisfied = async () => {
    setLoading(true);
    await base44.entities.JobPost.update(job.id, { status: 'completed' });
    await postSystemMessage(`🎉 Client confirmed satisfaction! The job is complete and payment has been released to ${job.winner_email}. Thank you both!`);
    await notify(job.winner_email, '💰 Payment Released!', `${user.full_name} is satisfied with your work. Payment has been released!`, 'payment');
    setLoading(false);
    onJobUpdated?.();
  };

  // ─── Client: Not satisfied → open dispute ───
  const handleDispute = async () => {
    if (!disputeReason) return;
    setLoading(true);
    let disputePhotoUrl = null;
    if (disputeFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: disputeFile });
      disputePhotoUrl = file_url;
    }
    await base44.entities.JobPost.update(job.id, {
      status: 'disputed',
      dispute_reason: disputeReason,
      dispute_photo_url: disputePhotoUrl || undefined,
    });
    await postSystemMessage(`⚠️ Client raised a dispute: "${disputeReason}"${disputePhotoUrl ? ' (photo attached)' : ''}. The avatar can now respond with a resolution.`);
    await notify(job.winner_email, '⚠️ Client Dispute Raised', `${user.full_name} is not satisfied and raised a dispute. Please respond in the chat.`, 'system');
    setLoading(false);
    setShowDisputeForm(false);
    onJobUpdated?.();
  };

  // ─── Avatar: Refund options ───
  const handleFullRefund = async () => {
    setLoading(true);
    await base44.entities.JobPost.update(job.id, { status: 'refunded' });
    await postSystemMessage(`↩️ Avatar agreed to a full refund. The client will be refunded in full. This job has been closed.`);
    await notify(job.posted_by_email, '↩️ Full Refund Agreed', `The avatar agreed to refund you in full for the job.`, 'payment');
    setLoading(false);
    onJobUpdated?.();
  };

  const handlePartialRefund = async () => {
    if (!partialAmount) return;
    setLoading(true);
    await base44.entities.JobPost.update(job.id, { status: 'completed', partial_amount: Number(partialAmount) });
    await postSystemMessage(`🤝 Partial settlement agreed: Client pays $${partialAmount}. Both parties have accepted this resolution.`);
    await notify(job.posted_by_email, '🤝 Partial Settlement', `The avatar proposed a partial payment of $${partialAmount}. This has been agreed.`, 'payment');
    setLoading(false);
    onJobUpdated?.();
  };

  const handleRaiseIssue = async () => {
    setLoading(true);
    await base44.entities.JobPost.update(job.id, { status: 'disputed' });
    await postSystemMessage(`🚨 This dispute has been escalated to the CoTask team. A team member will review the case and contact both parties. Please allow 24–48 hours.`);
    // Notify admin by creating a notification tagged for admins
    await base44.entities.Notification.create({
      user_email: 'admin',
      title: '🚨 Escalated Job Dispute',
      message: `Job "${job.title}" (ID: ${job.id}) has an escalated dispute between ${job.posted_by_email} and ${job.winner_email}.`,
      type: 'system',
      link: `/AdminDashboard`,
      reference_id: job.id,
    });
    await notify(job.posted_by_email, '🚨 Dispute Escalated', 'Your dispute has been escalated to the CoTask team. We will review within 24–48 hours.', 'system');
    setLoading(false);
    onJobUpdated?.();
  };

  if (!job) return null;

  // ─── AVATAR: Job in progress → show "Mark as Done" ───
  if (isAvatar && job.status === 'in_progress') {
    return (
      <div className="mx-4 my-3 glass rounded-2xl p-4 border border-primary/20 space-y-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          <p className="font-semibold text-sm">Mark Job as Done</p>
        </div>
        <p className="text-xs text-muted-foreground">Upload a photo proof of the completed job. The client will review and release payment.</p>

        {proofPreview ? (
          <div>
            <img src={proofPreview} alt="Proof" className="w-full max-h-40 object-cover rounded-xl border border-white/10" />
            <button type="button" onClick={() => { setProofPreview(null); setProofFile(null); }} className="text-xs text-muted-foreground hover:text-foreground mt-1">Remove photo</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <label className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center gap-1.5 hover:border-primary/30 transition-colors cursor-pointer">
              <input type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setProofFile(f); setProofPreview(URL.createObjectURL(f)); } e.target.value = ''; }} />
              <Camera className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground">Take Photo</span>
            </label>
            <label className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center gap-1.5 hover:border-primary/30 transition-colors cursor-pointer">
              <input type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { setProofFile(f); setProofPreview(URL.createObjectURL(f)); } e.target.value = ''; }} />
              <ImagePlus className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Upload from Gallery</span>
            </label>
          </div>
        )}

        <textarea value={proofNote} onChange={e => setProofNote(e.target.value)} rows={2} placeholder="Optional note about the completed work…"
          className="w-full text-sm bg-muted/50 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground resize-none" />

        <Button className="w-full gap-2" onClick={handleJobDone} disabled={!proofFile || loading}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><CheckCircle className="w-4 h-4" /> Submit Proof & Mark Done</>}
        </Button>
      </div>
    );
  }

  // ─── CLIENT: Job awaiting approval → review proof ───
  if (isClient && job.status === 'awaiting_approval') {
    return (
      <div className="mx-4 my-3 glass rounded-2xl p-4 border border-yellow-500/30 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <p className="font-semibold text-sm text-yellow-400">Job Completion — Your Review Needed</p>
        </div>
        <p className="text-xs text-muted-foreground">The avatar has marked this job as done. Review the proof below and confirm.</p>

        {job.proof_url && (
          <img src={job.proof_url} alt="Proof" className="w-full max-h-48 object-cover rounded-xl border border-white/10" />
        )}
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
              placeholder="Describe what went wrong or what was missing…"
              className="w-full text-sm bg-muted/50 border border-white/5 rounded-xl px-3 py-2 focus:outline-none focus:border-red-500/40 text-foreground placeholder:text-muted-foreground resize-none" />

            {disputePreview ? (
              <div>
                <img src={disputePreview} alt="Dispute" className="w-full max-h-32 object-cover rounded-xl border border-white/10" />
                <button onClick={() => { setDisputePreview(null); setDisputeFile(null); }} className="text-xs text-muted-foreground mt-1">Remove</button>
              </div>
            ) : (
              <label className="w-full border border-dashed border-white/10 rounded-xl p-3 flex items-center gap-2 hover:border-red-500/20 transition-colors text-xs text-muted-foreground cursor-pointer">
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

  // ─── AVATAR: Dispute raised → resolution options ───
  if (isAvatar && job.status === 'disputed') {
    return (
      <div className="mx-4 my-3 glass rounded-2xl p-4 border border-orange-500/30 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          <p className="font-semibold text-sm text-orange-400">Dispute — Choose a Resolution</p>
        </div>
        <p className="text-xs text-muted-foreground">The client raised a dispute. You can resolve this by offering a refund, partial payment, or escalating to our team.</p>
        {job.dispute_reason && <p className="text-xs italic text-muted-foreground">Client's reason: "{job.dispute_reason}"</p>}
        {job.dispute_photo_url && <img src={job.dispute_photo_url} alt="Dispute" className="w-full max-h-32 object-cover rounded-xl border border-white/10" />}

        <div className="space-y-2">
          <Button variant="outline" className="w-full gap-2 border-green-500/30 text-green-400 hover:bg-green-500/10" onClick={handleFullRefund} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Give Full Refund</>}
          </Button>

          <div className="flex gap-2">
            <input type="number" value={partialAmount} onChange={e => setPartialAmount(e.target.value)} placeholder="Partial amount ($)"
              className="flex-1 bg-muted/50 border border-white/5 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground" />
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

  // ─── Status banners for completed / refunded / escalated ───
  if (job.status === 'completed') {
    return (
      <div className="mx-4 my-3 glass rounded-2xl p-3 border border-green-500/20 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-400" />
        <p className="text-sm text-green-400 font-medium">Job completed. Payment has been released. ✓</p>
      </div>
    );
  }

  if (job.status === 'refunded') {
    return (
      <div className="mx-4 my-3 glass rounded-2xl p-3 border border-blue-500/20 flex items-center gap-2">
        <RefreshCw className="w-4 h-4 text-blue-400" />
        <p className="text-sm text-blue-400 font-medium">This job was refunded.</p>
      </div>
    );
  }

  return null;
}