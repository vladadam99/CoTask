import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/StatusBadge';
import SecurePaymentModal from '@/components/jobs/SecurePaymentModal';
import JobNegotiationFlow from '@/components/jobs/JobNegotiationFlow';
import JobCountdown from '@/components/jobs/JobCountdown';
import {
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  MessageCircle,
  Pencil,
  ShieldAlert,
  Star,
  Trash2,
  UserCheck,
  XCircle,
} from 'lucide-react';

const DURATION_LABELS = { hourly: '/hr', daily: '/day', weekly: '/wk', monthly: '/mo', custom: '' };

function money(value, fallback = 'TBD') {
  if (value === undefined || value === null || value === '') return fallback;
  return `$${Number(value).toLocaleString()}`;
}

function dateLine(job) {
  if (job?.flexible_dates) return 'Flexible timing';
  if (!job?.scheduled_date) return 'Date not set';
  return `${job.scheduled_date}${job.scheduled_time ? ` at ${job.scheduled_time}` : ''}`;
}

function SnapshotCard({ icon: Icon, label, value, tone = 'default' }) {
  const toneClass = tone === 'primary' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground';
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-black text-foreground">{value}</p>
    </div>
  );
}

function InfoPill({ children, tone = 'default' }) {
  const tones = {
    default: 'border-border bg-secondary text-muted-foreground',
    primary: 'border-primary/20 bg-primary/10 text-primary',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    blue: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    green: 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export default function JobDetail() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');
  const [applyForm, setApplyForm] = useState({ cover_message: '', proposed_rate: '', proposed_duration: '', available_from: '' });
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job-detail', jobId],
    queryFn: () => base44.entities.JobPost.get(jobId),
    enabled: !!jobId,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['job-applications', jobId],
    queryFn: () => base44.entities.JobApplication.filter({ job_id: jobId }, '-created_date'),
    enabled: !!jobId,
  });

  const { data: myApplication } = useQuery({
    queryKey: ['my-application', jobId, user?.email],
    queryFn: () => base44.entities.JobApplication.filter({ job_id: jobId, applicant_email: user.email }).then((r) => r[0] || null),
    enabled: !!jobId && !!user,
  });

  const { data: myAvatarProfile } = useQuery({
    queryKey: ['my-avatar-profile', user?.email],
    queryFn: () => base44.entities.AvatarProfile.filter({ user_email: user.email }).then((r) => r[0] || null),
    enabled: !!user,
  });

  const { data: applicantProfiles = [] } = useQuery({
    queryKey: ['applicant-profiles', jobId],
    queryFn: async () => {
      const profiles = await Promise.all(
        applications.map((app) => base44.entities.AvatarProfile.filter({ user_email: app.applicant_email }).then((r) => r[0]))
      );
      return profiles.filter(Boolean);
    },
    enabled: applications.length > 0,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('applyToJob', {
        job_id: jobId,
        cover_message: applyForm.cover_message,
        proposed_rate: applyForm.proposed_rate ? Number(applyForm.proposed_rate) : undefined,
        proposed_duration: applyForm.proposed_duration,
        available_from: applyForm.available_from,
        applicant_profile_id: myAvatarProfile?.id,
        applicant_type: 'avatar',
      });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data?.application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications', jobId] });
      queryClient.invalidateQueries({ queryKey: ['my-application', jobId, user?.email] });
      setShowApplyForm(false);
    },
  });

  const selectWinner = useMutation({
    mutationFn: async (app) => {
      const res = await base44.functions.invoke('createJobConversation', {
        jobId,
        jobTitle: job.title,
        clientEmail: job.posted_by_email,
        clientName: job.posted_by_name,
        avatarEmail: app.applicant_email,
        avatarName: app.applicant_name,
        scheduledDate: job.flexible_dates ? null : job.scheduled_date,
        action: 'assign_winner',
        winnerAppId: app.id,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-detail', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-applications', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-conversation', jobId] });
    },
  });

  const { data: jobConversation } = useQuery({
    queryKey: ['job-conversation', jobId],
    queryFn: () => base44.entities.Conversation.filter({ booking_id: `job_${jobId}` }).then((r) => r[0] || null),
    enabled: !!jobId && job?.status !== 'open',
  });

  const isAvatar = user?.selected_role === 'avatar';
  const isOwner = user?.email === job?.posted_by_email;
  const isHiredAgent = job?.winner_email === user?.email;
  const isProspectAgent = isAvatar && !isOwner && !isHiredAgent;
  const hasSubmittedProposal = !!myApplication;
  const paymentStatus = job?.payment_status || (job?.escrow_status === 'authorized' ? 'held' : job?.escrow_status === 'captured' ? 'released' : 'pending');
  const canApply = isProspectAgent && job?.status === 'open' && !hasSubmittedProposal;
  const showOwnerControls = isOwner;

  const openEditForm = () => {
    setEditForm({
      title: job.title || '',
      description: job.description || '',
      budget_min: job.budget_min || '',
      budget_max: job.budget_max || '',
      location: job.location || '',
      scheduled_date: job.scheduled_date || '',
      scheduled_time: job.scheduled_time || '',
    });
    setShowEditForm(true);
  };

  const saveEdit = async () => {
    await base44.functions.invoke('updateJobPost', {
      jobId,
      updates: {
        title: editForm.title,
        description: editForm.description,
        budget_min: editForm.budget_min ? Number(editForm.budget_min) : undefined,
        budget_max: editForm.budget_max ? Number(editForm.budget_max) : undefined,
        location: editForm.location,
        scheduled_date: editForm.scheduled_date || undefined,
        scheduled_time: editForm.scheduled_time || undefined,
      },
    });
    queryClient.invalidateQueries({ queryKey: ['job-detail', jobId] });
    setShowEditForm(false);
  };

  const nextAction = job?.status === 'open'
    ? isOwner
      ? {
          title: applications.length ? 'Review proposals' : 'Waiting for proposals',
          description: applications.length ? 'Compare agents, negotiate if needed, then choose who should handle the task.' : 'Your task is live. Agents will appear here when they propose.',
        }
      : canApply
        ? {
            title: 'Send a proposal',
            description: 'Explain how you will complete the task, your rate, and when you can start.',
          }
        : {
            title: 'Open task',
            description: 'Review the task details. Messages become available after the client selects an agent.',
          }
    : paymentStatus === 'pending' && isOwner
      ? {
          title: 'Fund Secure Payment',
          description: 'An agent has been selected. Fund Secure Payment to confirm the task before work begins.',
        }
      : paymentStatus === 'pending' && isHiredAgent
        ? {
            title: 'Waiting for Secure Payment',
            description: 'The client selected you and needs to fund Secure Payment before the task starts.',
          }
        : job?.status === 'in_progress'
          ? {
              title: 'Task in progress',
              description: isHiredAgent ? 'Share updates and proof as you complete the work.' : 'Follow progress and review proof when submitted.',
            }
          : job?.status === 'awaiting_approval'
            ? {
                title: 'Review proof',
                description: 'Completion proof is ready for client review.',
              }
            : {
                title: 'Task workspace',
                description: 'Follow status, payment, messages, and proof from this page.',
              };

  if (isLoading) {
    return (
      <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      </AppShell>
    );
  }

  if (!job) {
    return (
      <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
        <div className="flex h-64 items-center justify-center text-muted-foreground">Task not found.</div>
      </AppShell>
    );
  }

  const budgetValue = job.budget_min
    ? `${money(job.budget_min)}${DURATION_LABELS[job.duration_type] || ''}${job.negotiable ? ' negotiable' : ''}`
    : 'Budget not set';

  return (
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="p-4 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-bold text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                {isOwner && (
                  <div className="flex gap-2">
                    {job.status === 'open' && (
                      <Button variant="outline" size="sm" className="border-border" onClick={openEditForm}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                      onClick={async () => {
                        if (!confirm('Delete this task? This cannot be undone.')) return;
                        await base44.entities.JobPost.delete(jobId);
                        navigate('/JobMarketplace');
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={job.status} />
                <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Open Task</Badge>
                {job.camera_required && <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Proof required</Badge>}
              </div>

              <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-foreground md:text-4xl">
                {job.title}
              </h1>
              <p className="mt-2 text-sm font-semibold text-muted-foreground">
                Posted by {job.posted_by_name || 'Client'} - {job.posted_by_type === 'enterprise' ? 'Enterprise' : 'Client'}
              </p>

              <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-7 text-foreground/85">
                {job.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {job.remote_ok && <InfoPill tone="blue">Remote-friendly</InfoPill>}
                {job.travel_required && <InfoPill tone="amber">Travel needed</InfoPill>}
                {job.flexible_dates && <InfoPill tone="green">Flexible timing</InfoPill>}
                {(job.skills_required || []).slice(0, 5).map((skill) => <InfoPill key={skill}>{skill}</InfoPill>)}
                {(job.languages_required || []).slice(0, 4).map((lang) => <InfoPill key={lang}>{lang}</InfoPill>)}
                {(job.equipment_needed || []).slice(0, 4).map((eq) => <InfoPill key={eq}>{eq}</InfoPill>)}
              </div>
            </div>

            <aside className="border-t border-border bg-secondary/35 p-4 lg:border-l lg:border-t-0">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <SnapshotCard icon={MapPin} label="Where" value={job.location || (job.remote_ok ? 'Remote-friendly' : 'Location not set')} />
                <SnapshotCard icon={Calendar} label="When" value={dateLine(job)} />
                <SnapshotCard icon={DollarSign} label="Budget" value={budgetValue} tone="primary" />
                <SnapshotCard icon={UserCheck} label="Proposals" value={`${applications.length || job.application_count || 0} received`} />
              </div>
            </aside>
          </div>
        </section>

        <section className="rounded-lg border border-primary/20 bg-primary/10 p-4 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="section-label text-primary">Next action</p>
              <h2 className="mt-1 text-xl font-black text-foreground">{nextAction.title}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{nextAction.description}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:shrink-0">
              {canApply && !showApplyForm && user?.identity_verified && (
                <Button className="h-11 font-bold" onClick={() => setShowApplyForm(true)}>Submit Proposal</Button>
              )}
              {paymentStatus === 'pending' && job.winner_email && isOwner && !showPaymentModal && (
                <Button variant="payment" className="h-11 gap-2 font-bold" onClick={() => setShowPaymentModal(true)}>
                  <DollarSign className="h-4 w-4" /> Fund Secure Payment
                </Button>
              )}
              {jobConversation && (isHiredAgent || showOwnerControls) && (
                <Button className="h-11 gap-2 font-bold" onClick={() => navigate(`/Messages?conversation=${jobConversation.id}`)}>
                  <MessageCircle className="h-4 w-4" /> Open Messages
                </Button>
              )}
            </div>
          </div>
        </section>

        {showPaymentModal && (
          <section className="rounded-lg border border-primary/20 bg-card p-4 shadow-sm">
            <SecurePaymentModal
              job={{ ...job, task_type: 'job', escrow_amount: job.budget_max || job.budget_min || 50 }}
              onCancel={() => setShowPaymentModal(false)}
            />
          </section>
        )}

        {job.winner_email && paymentStatus === 'pending' && isHiredAgent && (
          <section className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
              <div>
                <p className="text-sm font-black text-blue-700 dark:text-blue-300">Waiting for client payment</p>
                <p className="text-xs text-muted-foreground">The client selected you and now needs to fund Secure Payment.</p>
              </div>
            </div>
          </section>
        )}

        {job.stripe_payment_intent_id && paymentStatus === 'held' && isOwner && (
          <section className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              <div>
                <p className="text-sm font-black text-amber-700 dark:text-amber-300">{money(job.escrow_amount)} Secure Payment held</p>
                <p className="text-xs text-muted-foreground">Funds are released to the Local Agent after approval or resolution.</p>
              </div>
            </div>
          </section>
        )}

        {paymentStatus === 'released' && (showOwnerControls || isHiredAgent) && (
          <section className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-700 dark:text-green-300" />
              <p className="text-sm font-bold text-green-700 dark:text-green-300">Secure Payment paid to the Local Agent.</p>
            </div>
          </section>
        )}

        {showEditForm && (
          <section className="rounded-lg border border-primary/20 bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black">Edit task</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowEditForm(false)}>Close</Button>
            </div>
            <div className="grid gap-4">
              <label className="block">
                <span className="text-sm font-bold">Title</span>
                <input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </label>
              <label className="block">
                <span className="text-sm font-bold">Description</span>
                <textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={4}
                  className="mt-1.5 w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block">
                  <span className="text-sm font-bold">Budget min</span>
                  <input type="number" value={editForm.budget_min} onChange={(e) => setEditForm((p) => ({ ...p, budget_min: e.target.value }))}
                    className="mt-1.5 h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold">Budget max</span>
                  <input type="number" value={editForm.budget_max} onChange={(e) => setEditForm((p) => ({ ...p, budget_max: e.target.value }))}
                    className="mt-1.5 h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-bold">Location</span>
                  <input value={editForm.location} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                    className="mt-1.5 h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold">Date</span>
                  <input type="date" value={editForm.scheduled_date} onChange={(e) => setEditForm((p) => ({ ...p, scheduled_date: e.target.value }))}
                    className="mt-1.5 h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold">Time</span>
                  <input type="time" value={editForm.scheduled_time || ''} onChange={(e) => setEditForm((p) => ({ ...p, scheduled_time: e.target.value }))}
                    className="mt-1.5 h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </label>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={saveEdit}>Save Changes</Button>
                <Button variant="outline" className="border-border" onClick={() => setShowEditForm(false)}>Cancel</Button>
              </div>
            </div>
          </section>
        )}

        {hasSubmittedProposal && !isHiredAgent && (
          <section className={`rounded-lg border p-4 ${myApplication.status === 'rejected' ? 'border-red-500/20 bg-red-500/10' : 'border-amber-500/20 bg-amber-500/10'}`}>
            <div className="flex items-center gap-2">
              {myApplication.status === 'rejected' ? <XCircle className="h-5 w-5 text-red-600" /> : <Clock className="h-5 w-5 text-amber-700 dark:text-amber-300" />}
              <div>
                <p className="text-sm font-black">{myApplication.status === 'rejected' ? 'Proposal not selected' : 'Proposal submitted'}</p>
                <p className="text-xs text-muted-foreground">{myApplication.status === 'rejected' ? 'The client chose another agent or declined this proposal.' : 'Your proposal is pending client review.'}</p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-border bg-card p-3 text-sm">
              <p className="text-muted-foreground">"{myApplication.cover_message}"</p>
              <div className="mt-2 flex flex-wrap gap-3 font-bold">
                {myApplication.proposed_rate && <span>{money(myApplication.proposed_rate)} rate</span>}
                {myApplication.available_from && <span>Available: {myApplication.available_from}</span>}
              </div>
            </div>
          </section>
        )}

        {canApply && !showApplyForm && !user?.identity_verified && (
          <section className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex items-center gap-4">
              <ShieldAlert className="h-6 w-6 shrink-0 text-amber-700 dark:text-amber-300" />
              <div className="min-w-0 flex-1">
                <p className="font-black">Identity Verification Required</p>
                <p className="text-xs text-muted-foreground">You must verify your identity before submitting proposals.</p>
              </div>
              <Button size="sm" onClick={() => navigate('/IdentityVerification')}>Verify</Button>
            </div>
          </section>
        )}

        {showApplyForm && (
          <section className="rounded-lg border border-primary/20 bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-black">Your proposal</h3>
            <div className="grid gap-4">
              <label className="block">
                <span className="text-sm font-bold">Cover message *</span>
                <textarea
                  value={applyForm.cover_message}
                  onChange={(e) => setApplyForm((p) => ({ ...p, cover_message: e.target.value }))}
                  placeholder="Introduce yourself, explain your plan, and mention relevant experience."
                  rows={4}
                  className="mt-1.5 w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold">Your rate</span>
                  <input type="number" value={applyForm.proposed_rate} onChange={(e) => setApplyForm((p) => ({ ...p, proposed_rate: e.target.value }))}
                    placeholder="35" className="mt-1.5 h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold">Available from</span>
                  <input type="date" value={applyForm.available_from} onChange={(e) => setApplyForm((p) => ({ ...p, available_from: e.target.value }))}
                    className="mt-1.5 h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </label>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending || !applyForm.cover_message}>
                  {applyMutation.isPending ? 'Submitting...' : 'Submit Proposal'}
                </Button>
                <Button variant="outline" className="border-border" onClick={() => setShowApplyForm(false)}>Cancel</Button>
              </div>
            </div>
          </section>
        )}

        {showOwnerControls && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label">Proposals</p>
                <h2 className="text-xl font-black text-foreground">{applications.length} agent response{applications.length === 1 ? '' : 's'}</h2>
              </div>
            </div>

            {applications.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
                <UserCheck className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
                <h3 className="text-lg font-black text-foreground">No proposals yet</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">Agents will appear here with their rate, availability, and proposal message.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {applications.map((app) => {
                  const profile = applicantProfiles.find((p) => p?.user_email === app.applicant_email);
                  return (
                    <article key={app.id} className={`rounded-lg border bg-card p-4 shadow-sm transition-all ${app.status === 'accepted' ? 'border-green-500/30' : 'border-border hover:border-primary/30'}`}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-base font-black text-primary">
                              {profile?.photo_url ? <img src={profile.photo_url} alt={app.applicant_name} className="h-full w-full object-cover" /> : app.applicant_name?.[0] || 'A'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-black text-foreground">{app.applicant_name}</p>
                                <StatusBadge status={app.status} />
                              </div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                                <span className="capitalize">{app.applicant_type}</span>
                                {profile?.rating > 0 && <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 text-amber-400" />{profile.rating.toFixed(1)}</span>}
                                {profile?.completed_jobs > 0 && <span>{profile.completed_jobs} tasks done</span>}
                              </div>
                            </div>
                          </div>

                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{app.cover_message}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                            {app.proposed_rate && <InfoPill tone="primary">{money(app.proposed_rate)}</InfoPill>}
                            {app.available_from && <InfoPill>Available {app.available_from}</InfoPill>}
                          </div>

                          <JobNegotiationFlow
                            application={app}
                            job={job}
                            user={user}
                            onRateAgreed={() => {
                              queryClient.invalidateQueries({ queryKey: ['job-applications', jobId] });
                            }}
                          />
                        </div>

                        {showOwnerControls && job.status === 'open' && app.status === 'pending' && (
                          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                            <Button size="sm" variant="outline" className="border-border" asChild>
                              <Link to={`/AvatarView?id=${profile?.id || ''}`}>View Profile</Link>
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 text-white hover:bg-green-700"
                              onClick={() => selectWinner.mutate(app)}
                              disabled={selectWinner.isPending}
                            >
                              <Award className="h-3.5 w-3.5" /> Select Agent
                            </Button>
                          </div>
                        )}
                        {app.status === 'accepted' && <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {job.status === 'in_progress' && !job.flexible_dates && job.scheduled_date && (isHiredAgent || showOwnerControls) && (
          <JobCountdown scheduledDate={job.scheduled_date} />
        )}

        {job.winner_email && job.status !== 'open' && (
          <section className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-black text-green-700 dark:text-green-300">Task assigned</p>
                <p className="text-xs text-muted-foreground">This task has been assigned to a Local Agent.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

