import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  Play,
  RefreshCw,
  Scale,
  XCircle,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import JobReviewForm from './JobReviewForm';

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft(null);
      return undefined;
    }

    const target = new Date(targetDate).getTime();
    const calc = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ expired: true });
        return;
      }
      setTimeLeft({
        expired: false,
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function CountdownGrid({ countdown }) {
  const units = [
    { label: 'Days', value: countdown?.days ?? 0 },
    { label: 'Hours', value: countdown?.hours ?? 0 },
    { label: 'Mins', value: countdown?.minutes ?? 0 },
    { label: 'Secs', value: countdown?.seconds ?? 0 },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {units.map((unit) => (
        <div key={unit.label} className="rounded-lg border border-border bg-secondary/55 p-3 text-center">
          <div className="text-2xl font-semibold tabular-nums text-foreground">
            {String(unit.value).padStart(2, '0')}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">{unit.label}</div>
        </div>
      ))}
    </div>
  );
}

function ActionPanel({ tone = 'primary', icon, title, children }) {
  const toneClasses = {
    primary: 'border-primary/20 bg-primary/5',
    success: 'border-green-200 bg-green-50',
    warning: 'border-amber-200 bg-amber-50',
    danger: 'border-red-200 bg-red-50',
    info: 'border-blue-200 bg-blue-50',
    neutral: 'border-border bg-card',
  };

  return (
    <div className={`mx-4 my-3 rounded-lg border p-4 shadow-sm ${toneClasses[tone] || toneClasses.neutral}`}>
      <div className="mb-3 flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-sm">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{title}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function EvidenceInput({ filePreview, onPick, onRemove, label, compact = false }) {
  if (filePreview) {
    return (
      <div className="space-y-1">
        <img src={filePreview} alt={label} className="max-h-48 w-full rounded-lg border border-border object-cover" />
        <button type="button" onClick={onRemove} className="text-xs font-medium text-muted-foreground hover:text-foreground">
          Remove photo
        </button>
      </div>
    );
  }

  return (
    <label className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card text-center transition-colors hover:border-primary/40 ${compact ? 'p-3' : 'p-6'}`}>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
          event.target.value = '';
        }}
      />
      <Camera className="h-5 w-5 text-primary" />
      <span className="text-xs text-muted-foreground">{label}</span>
    </label>
  );
}

export default function JobActionCard({ job, user, userRole, conversationId, onJobUpdated }) {
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

  const displayName = user?.full_name || 'User';
  const isJobWinner = user?.email === job?.winner_email;
  const isJobPoster = user?.email === job?.posted_by_email;
  const isAvatar = isJobWinner && (!isJobPoster || userRole === 'avatar');
  const isClient = isJobPoster && (!isJobWinner || userRole !== 'avatar');
  const scheduledStr = job?.scheduled_date
    ? job?.scheduled_time
      ? `${job.scheduled_date}T${job.scheduled_time}`
      : `${job.scheduled_date}T09:00`
    : null;
  const countdown = useCountdown(scheduledStr && job?.status === 'in_progress' && !job?.started_at ? scheduledStr : null);

  if (!job) return null;

  const postSystemMessage = async (content, notifyOptions = {}) => {
    if (!conversationId) return;
    await base44.functions.invoke('sendMessage', {
      conversationId,
      content,
      messageType: 'system',
      ...notifyOptions,
    });
  };

  const resetProof = () => {
    setProofFile(null);
    setProofPreview(null);
    setProofNote('');
    setShowProofForm(false);
  };

  const resetDispute = () => {
    setDisputeReason('');
    setDisputeFile(null);
    setDisputePreview(null);
    setShowDisputeForm(false);
  };

  const handleStartJob = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('updateJobProgress', { jobId: job.id, action: 'start' });
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await postSystemMessage(`Task started at ${timeStr} by ${displayName}.`, {
        notifyTitle: 'Task has started',
        notifyMessage: `${displayName} has started working on your task.`,
        notifyType: 'booking_accepted',
      });
      onJobUpdated?.();
    } catch (error) {
      console.error('Task start failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobDone = async () => {
    if (!proofFile) return;
    setLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: proofFile });
      const startedAt = job.started_at ? new Date(job.started_at) : null;
      const endedAt = new Date();
      const durationMins = startedAt ? Math.round((endedAt - startedAt) / 60000) : null;
      const durationStr = durationMins != null
        ? durationMins >= 60
          ? `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`
          : `${durationMins}m`
        : null;
      const summary = [
        `Task marked as ready for review by ${displayName}.`,
        startedAt ? `Started: ${startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : null,
        durationStr ? `Duration: ${durationStr}` : null,
        proofNote ? `Note: "${proofNote}"` : null,
        'Proof photo uploaded. Awaiting client review.',
      ].filter(Boolean).join('\n');

      await Promise.all([
        base44.functions.invoke('updateJobProgress', {
          jobId: job.id,
          action: 'mark_done',
          payload: { proof_url: file_url, proof_note: proofNote },
        }),
        postSystemMessage(summary, {
          notifyTitle: 'Task Ready for Review',
          notifyMessage: `${displayName} has completed the task. Please review the proof.`,
          notifyType: 'booking_accepted',
        }),
      ]);

      resetProof();
      onJobUpdated?.();
    } catch (error) {
      console.error('Proof upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSatisfied = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('releaseTaskPayment', {
        task_type: 'job',
        task_id: job.id,
      });
      await postSystemMessage('Client approved the task. Secure Payment has been released to the Local Agent.', {
        notifyTitle: 'Payment Released',
        notifyMessage: 'The client approved the task and released payment.',
        notifyType: 'payment',
        notifyTargetRole: 'avatar',
      });
      onJobUpdated?.();
    } catch (error) {
      console.error('Completion approval failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) return;
    setLoading(true);
    try {
      let disputePhotoUrl = null;
      if (disputeFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: disputeFile });
        disputePhotoUrl = file_url;
      }

      await Promise.all([
        base44.functions.invoke('disputeTaskPayment', {
          task_type: 'job',
          task_id: job.id,
          dispute_reason: disputeReason,
        }),
        postSystemMessage(`Client raised an issue: "${disputeReason}"${disputePhotoUrl ? ' Photo evidence was uploaded.' : ''}`, {
          notifyTitle: 'Issue Raised',
          notifyMessage: 'The client raised an issue. Please respond in messages.',
          notifyTargetRole: 'avatar',
        }),
      ]);

      resetDispute();
      onJobUpdated?.();
    } catch (error) {
      console.error('Issue submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFullRefund = async () => {
    setLoading(true);
    try {
      await Promise.all([
        base44.functions.invoke('updateJobProgress', { jobId: job.id, action: 'refund' }),
        postSystemMessage('Local Agent agreed to a full refund. Task closed.', {
          notifyTitle: 'Full Refund Agreed',
          notifyMessage: 'The Local Agent agreed to refund the task in full.',
          notifyType: 'payment',
          notifyTargetRole: 'user',
        }),
      ]);
      onJobUpdated?.();
    } catch (error) {
      console.error('Refund failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePartialRefund = async () => {
    if (!partialAmount) return;
    setLoading(true);
    try {
      await Promise.all([
        base44.functions.invoke('updateJobProgress', {
          jobId: job.id,
          action: 'propose_partial',
          payload: { amount: Number(partialAmount) },
        }),
        postSystemMessage(`Local Agent proposed a partial settlement: client pays $${partialAmount}. Awaiting client acceptance.`, {
          notifyTitle: 'Partial Settlement Proposal',
          notifyMessage: `The Local Agent proposed a partial payment of $${partialAmount}. Please accept or reject.`,
          notifyType: 'payment',
          notifyTargetRole: 'user',
        }),
      ]);
      onJobUpdated?.();
    } catch (error) {
      console.error('Partial settlement failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptPartialRefund = async () => {
    if (!job.partial_amount) return;
    setLoading(true);
    try {
      await Promise.all([
        base44.functions.invoke('updateJobProgress', { jobId: job.id, action: 'accept_partial' }),
        postSystemMessage(`Client accepted partial settlement of $${job.partial_amount}.`, {
          notifyTitle: 'Partial Settlement Accepted',
          notifyMessage: `Client accepted your partial settlement proposal of $${job.partial_amount}.`,
          notifyType: 'payment',
          notifyTargetRole: 'avatar',
        }),
      ]);
      onJobUpdated?.();
    } catch (error) {
      console.error('Accept partial failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPartialRefund = async () => {
    setLoading(true);
    try {
      await Promise.all([
        base44.functions.invoke('updateJobProgress', { jobId: job.id, action: 'reject_partial' }),
        postSystemMessage('Client rejected the partial settlement proposal.', {
          notifyTitle: 'Partial Settlement Rejected',
          notifyMessage: 'Client rejected your partial settlement proposal.',
          notifyType: 'payment',
          notifyTargetRole: 'avatar',
        }),
      ]);
      onJobUpdated?.();
    } catch (error) {
      console.error('Reject partial failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseIssue = async () => {
    setLoading(true);
    try {
      await Promise.all([
        base44.functions.invoke('updateJobProgress', { jobId: job.id, action: 'escalate' }),
        postSystemMessage('Issue escalated to the CoTask team for review.', {
          notifyTitle: 'Issue Escalated',
          notifyMessage: 'Your issue has been escalated to the CoTask team.',
          notifyTargetRole: 'user',
        }),
      ]);
      onJobUpdated?.();
    } catch (error) {
      console.error('Escalation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (job.status === 'in_progress' && job.payment_status === 'held') {
    if (!job.started_at) {
      if (isAvatar) {
        const hasSchedule = Boolean(scheduledStr);
        const timerRunning = hasSchedule && countdown && !countdown.expired;
        const canStart = !hasSchedule || (countdown && countdown.expired);

        if (timerRunning) {
          return (
            <ActionPanel tone="primary" icon={<Clock className="h-4 w-4 text-primary" />} title="Task starts in">
              <CountdownGrid countdown={countdown} />
              <p className="text-sm text-muted-foreground">You can start the task when the timer reaches zero.</p>
            </ActionPanel>
          );
        }

        if (canStart) {
          return (
            <ActionPanel tone="success" icon={<Play className="h-4 w-4 text-green-600" />} title="Ready to start">
              <p className="text-sm text-muted-foreground">Start the task when you are ready. The client will be notified.</p>
              <Button variant="live" className="w-full gap-2" onClick={handleStartJob} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Start Task
              </Button>
            </ActionPanel>
          );
        }

        return null;
      }

      if (isClient) {
        return (
          <ActionPanel tone="primary" icon={<Clock className="h-4 w-4 text-primary" />} title={scheduledStr && countdown && !countdown.expired ? 'Task starts in' : 'Waiting for Local Agent'}>
            {scheduledStr && countdown && !countdown.expired ? (
              <CountdownGrid countdown={countdown} />
            ) : (
              <p className="text-sm text-muted-foreground">The Local Agent will start the task from their task detail page.</p>
            )}
          </ActionPanel>
        );
      }

      return null;
    }

    if (isAvatar) {
      if (!showProofForm) {
        return (
          <div className="mx-4 my-3 rounded-lg border border-border bg-card p-3 text-center shadow-sm">
            <Button variant="outline" className="gap-2 rounded-full" onClick={() => setShowProofForm(true)}>
              <CheckCircle className="h-4 w-4" />
              Mark Ready for Review
            </Button>
          </div>
        );
      }

      return (
        <ActionPanel tone="primary" icon={<Camera className="h-4 w-4 text-primary" />} title="Submit proof">
          <p className="text-sm text-muted-foreground">Upload a clear photo and optional note so the client can review the completed task.</p>
          <EvidenceInput
            label="Take a photo or upload proof from your gallery"
            filePreview={proofPreview}
            onPick={(file) => {
              setProofFile(file);
              setProofPreview(URL.createObjectURL(file));
            }}
            onRemove={() => {
              setProofFile(null);
              setProofPreview(null);
            }}
          />
          <textarea
            value={proofNote}
            onChange={(event) => setProofNote(event.target.value)}
            rows={3}
            placeholder="Optional note about the completed work"
            className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
          />
          <div className="flex gap-2">
            <Button className="flex-1 gap-2" onClick={handleJobDone} disabled={!proofFile || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Submit Proof
            </Button>
            <Button variant="outline" onClick={resetProof} disabled={loading}>Cancel</Button>
          </div>
        </ActionPanel>
      );
    }

    if (isClient) {
      return (
        <ActionPanel tone="success" icon={<Play className="h-4 w-4 text-green-600" />} title="Task in progress">
          <p className="text-sm text-muted-foreground">The Local Agent is working on the task. You will be asked to review proof before Secure Payment is released.</p>
        </ActionPanel>
      );
    }

    return null;
  }

  if (job.status === 'awaiting_approval') {
    if (isClient) {
      return (
        <ActionPanel tone="warning" icon={<AlertTriangle className="h-4 w-4 text-amber-600" />} title="Review proof">
          <p className="text-sm text-muted-foreground">The Local Agent marked this task as ready for review. Approve completion or raise an issue.</p>
          {job.proof_url && <img src={job.proof_url} alt="Task proof" className="max-h-56 w-full rounded-lg border border-border object-cover" />}
          {job.proof_note && <p className="rounded-lg border border-border bg-card p-3 text-sm italic text-muted-foreground">"{job.proof_note}"</p>}

          {!showDisputeForm ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="payment" className="flex-1 gap-2" onClick={handleSatisfied} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Approve Completion
              </Button>
              <Button variant="outline" className="flex-1 gap-2 border-red-200 text-red-700 hover:bg-red-50" onClick={() => setShowDisputeForm(true)} disabled={loading}>
                <XCircle className="h-4 w-4" />
                Raise Issue
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={disputeReason}
                onChange={(event) => setDisputeReason(event.target.value)}
                rows={3}
                placeholder="Describe what needs to be reviewed"
                className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
              />
              <EvidenceInput
                compact
                label="Attach photo evidence (optional)"
                filePreview={disputePreview}
                onPick={(file) => {
                  setDisputeFile(file);
                  setDisputePreview(URL.createObjectURL(file));
                }}
                onRemove={() => {
                  setDisputeFile(null);
                  setDisputePreview(null);
                }}
              />
              <div className="flex gap-2">
                <Button className="flex-1 gap-2 bg-red-600 text-white hover:bg-red-700" onClick={handleDispute} disabled={!disputeReason.trim() || loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                  Submit Issue
                </Button>
                <Button variant="outline" onClick={resetDispute} disabled={loading}>Cancel</Button>
              </div>
            </div>
          )}
        </ActionPanel>
      );
    }

    if (isAvatar) {
      return (
        <ActionPanel tone="warning" icon={<Loader2 className="h-4 w-4 animate-spin text-amber-600" />} title="Waiting for client review">
          <p className="text-sm text-muted-foreground">Proof has been submitted. The client can approve completion or raise an issue.</p>
        </ActionPanel>
      );
    }
  }

  if (isClient && job.status === 'disputed' && job.partial_amount) {
    return (
      <ActionPanel tone="info" icon={<DollarSign className="h-4 w-4 text-blue-600" />} title="Partial settlement proposed">
        <p className="text-sm text-muted-foreground">
          The Local Agent proposed a partial settlement of <span className="font-semibold text-foreground">${job.partial_amount}</span>.
        </p>
        <div className="flex gap-2">
          <Button className="flex-1 gap-2 bg-green-600 text-white hover:bg-green-700" onClick={handleAcceptPartialRefund} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Accept
          </Button>
          <Button variant="outline" className="flex-1 gap-2 border-red-200 text-red-700 hover:bg-red-50" onClick={handleRejectPartialRefund} disabled={loading}>
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        </div>
      </ActionPanel>
    );
  }

  if (isAvatar && job.status === 'disputed') {
    return (
      <ActionPanel tone="danger" icon={<AlertTriangle className="h-4 w-4 text-red-600" />} title="Issue raised">
        {job.dispute_reason && <p className="rounded-lg border border-red-100 bg-card p-3 text-sm italic text-muted-foreground">Client reason: "{job.dispute_reason}"</p>}
        {job.dispute_photo_url && <img src={job.dispute_photo_url} alt="Issue evidence" className="max-h-40 w-full rounded-lg border border-border object-cover" />}
        <div className="space-y-2">
          <Button variant="outline" className="w-full gap-2 border-green-200 text-green-700 hover:bg-green-50" onClick={handleFullRefund} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refund Secure Payment
          </Button>
          <div className="flex gap-2">
            <input
              type="number"
              value={partialAmount}
              onChange={(event) => setPartialAmount(event.target.value)}
              placeholder="Partial amount ($)"
              className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
            />
            <Button variant="outline" className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={handlePartialRefund} disabled={!partialAmount || loading}>
              <DollarSign className="h-4 w-4" />
              Offer Partial
            </Button>
          </div>
          <Button variant="outline" className="w-full gap-2 border-red-200 text-red-700 hover:bg-red-50" onClick={handleRaiseIssue} disabled={loading}>
            <AlertTriangle className="h-4 w-4" />
            Escalate to CoTask Team
          </Button>
          <Link
            to={`/DisputeAgent?jobId=${job.id}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
          >
            <Scale className="h-4 w-4" />
            Get Resolution Help
          </Link>
        </div>
      </ActionPanel>
    );
  }

  if (job.status === 'completed' || job.status === 'refunded' || (job.status === 'disputed' && job.partial_amount)) {
    const avatarReviewDone = job.review_left_by_avatar;
    const clientReviewDone = job.review_left_by_client;

    return (
      <ActionPanel tone="success" icon={<CheckCircle className="h-4 w-4 text-green-600" />} title={job.status === 'refunded' ? 'Task refunded' : 'Task completed'}>
        <p className="text-sm text-muted-foreground">
          {job.status === 'refunded'
            ? 'This task was refunded.'
            : isAvatar
              ? 'Payment has been released for this completed task.'
              : 'The task is complete and Secure Payment has been released.'}
        </p>
        {isAvatar && !avatarReviewDone && (
          <JobReviewForm job={job} user={user} reviewerType="avatar" onDone={onJobUpdated} />
        )}
        {isClient && !clientReviewDone && (
          <JobReviewForm job={job} user={user} reviewerType="client" onDone={onJobUpdated} />
        )}
        {((isAvatar && avatarReviewDone) || (isClient && clientReviewDone) || (job.status === 'disputed' && job.partial_amount)) && (
          <p className="text-xs text-muted-foreground">
            {job.status === 'disputed' && job.partial_amount ? 'Awaiting settlement acceptance.' : "You've already left a review."}
          </p>
        )}
      </ActionPanel>
    );
  }

  return null;
}
