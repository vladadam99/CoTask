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
import { ArrowLeft, MapPin, Clock, DollarSign, Users, CheckCircle, XCircle, Star, Award } from 'lucide-react';

const DURATION_LABELS = { hourly: '/hr', daily: '/day', weekly: '/wk', monthly: '/mo', custom: '' };

export default function JobDetail() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const jobId = urlParams.get('id');
  const [applyForm, setApplyForm] = useState({ cover_message: '', proposed_rate: '', proposed_duration: '', available_from: '' });
  const [showApplyForm, setShowApplyForm] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job-detail', jobId],
    queryFn: () => base44.entities.JobPost.filter({ id: jobId }).then(r => r[0]),
    enabled: !!jobId,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['job-applications', jobId],
    queryFn: () => base44.entities.JobApplication.filter({ job_id: jobId }, '-created_date'),
    enabled: !!jobId,
  });

  const { data: myApplication } = useQuery({
    queryKey: ['my-application', jobId, user?.email],
    queryFn: () => base44.entities.JobApplication.filter({ job_id: jobId, applicant_email: user.email }).then(r => r[0] || null),
    enabled: !!jobId && !!user,
  });

  const { data: myAvatarProfile } = useQuery({
    queryKey: ['my-avatar-profile', user?.email],
    queryFn: () => base44.entities.AvatarProfile.filter({ user_email: user.email }).then(r => r[0] || null),
    enabled: !!user,
  });

  const { data: applicantProfiles = [] } = useQuery({
    queryKey: ['applicant-profiles', jobId],
    queryFn: async () => {
      const profiles = await Promise.all(
        applications.map(app => base44.entities.AvatarProfile.filter({ user_email: app.applicant_email }).then(r => r[0]))
      );
      return profiles.filter(Boolean);
    },
    enabled: applications.length > 0,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const app = await base44.entities.JobApplication.create({
        job_id: jobId,
        job_title: job.title,
        applicant_email: user.email,
        applicant_name: user.full_name,
        applicant_type: user.role,
        cover_message: applyForm.cover_message,
        proposed_rate: applyForm.proposed_rate ? Number(applyForm.proposed_rate) : undefined,
        proposed_duration: applyForm.proposed_duration,
        available_from: applyForm.available_from,
        client_email: job.posted_by_email,
        status: 'pending',
      });
      await base44.entities.JobPost.update(jobId, { application_count: (job.application_count || 0) + 1 });
      await base44.entities.Notification.create({
        user_email: job.posted_by_email,
        title: 'New Job Application',
        message: `${user.full_name} applied for your job: ${job.title}`,
        type: 'booking_request',
        link: `/JobDetail?id=${jobId}`,
        reference_id: jobId,
      });
      return app;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications', jobId] });
      queryClient.invalidateQueries({ queryKey: ['my-application', jobId, user?.email] });
      setShowApplyForm(false);
    },
  });

  const selectWinner = useMutation({
    mutationFn: async (app) => {
      await base44.entities.JobPost.update(jobId, {
        status: 'in_progress',
        winner_application_id: app.id,
        winner_email: app.applicant_email,
      });
      await base44.entities.JobApplication.update(app.id, { status: 'accepted' });
      // Reject all others
      for (const other of applications.filter(a => a.id !== app.id)) {
        await base44.entities.JobApplication.update(other.id, { status: 'rejected' });
      }
      await base44.entities.Notification.create({
        user_email: app.applicant_email,
        title: '🎉 You got the job!',
        message: `You were selected for: ${job.title}`,
        type: 'booking_accepted',
        link: `/JobDetail?id=${jobId}`,
        reference_id: jobId,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-detail', jobId] }),
  });

  const isAvatar = user?.role === 'avatar' || !!myAvatarProfile;
  const isOwner = user?.email === job?.posted_by_email;
  // Avatars can always apply (even if same email posted the job as a user/enterprise role)
  const canApply = isAvatar && job?.status === 'open' && !myApplication;
  const showOwnerControls = isOwner && !isAvatar;

  if (isLoading) return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    </AppShell>
  );

  if (!job) return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="text-center py-20 text-muted-foreground">Job not found.</div>
    </AppShell>
  );

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back */}
        <Link to="/JobMarketplace">
          <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-primary/30 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>

        {/* Job Header */}
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold">{job.title}</h1>
                <StatusBadge status={job.status} />
                {job.camera_required && <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">📷 Camera Required</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">Posted by {job.posted_by_name} · {job.posted_by_type}</p>
            </div>
            {showOwnerControls && job.status === 'open' && (
              <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                {job.application_count || 0} applicant{job.application_count !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <p className="text-sm leading-relaxed">{job.description}</p>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {job.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{job.location}</span>}
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{job.duration_value} {job.duration_type}</span>
            {job.budget_min && (
              <span className="flex items-center gap-1.5 text-primary font-semibold">
                <DollarSign className="w-4 h-4" />${job.budget_min}{job.budget_max ? `–$${job.budget_max}` : '+'}{DURATION_LABELS[job.duration_type]}
                {job.negotiable && <span className="text-xs text-muted-foreground font-normal">(negotiable)</span>}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {job.remote_ok && <span className="px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">Remote OK</span>}
            {job.travel_required && <span className="px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">Travel Required</span>}
            {job.flexible_dates ? <span className="px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">Flexible Dates</span>
              : job.scheduled_date && <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground">📅 {job.scheduled_date}</span>}
          </div>

          {(job.skills_required || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">SKILLS REQUIRED</p>
              <div className="flex flex-wrap gap-1.5">
                {job.skills_required.map(s => <span key={s} className="text-xs bg-white/5 border border-white/5 rounded-full px-2.5 py-1">{s}</span>)}
              </div>
            </div>
          )}
          {(job.languages_required || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">LANGUAGES</p>
              <div className="flex flex-wrap gap-1.5">
                {job.languages_required.map(l => <span key={l} className="text-xs bg-white/5 border border-white/5 rounded-full px-2.5 py-1">{l}</span>)}
              </div>
            </div>
          )}
          {(job.equipment_needed || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">EQUIPMENT NEEDED</p>
              <div className="flex flex-wrap gap-1.5">
                {job.equipment_needed.map(eq => <span key={eq} className="text-xs bg-white/5 border border-white/5 rounded-full px-2.5 py-1">{eq}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* My Application Status */}
        {myApplication && (
          <div className={`glass rounded-2xl p-4 border ${myApplication.status === 'accepted' ? 'border-green-500/30' : myApplication.status === 'rejected' ? 'border-red-500/20' : 'border-yellow-500/20'}`}>
            <div className="flex items-center gap-2">
              {myApplication.status === 'accepted' ? <CheckCircle className="w-5 h-5 text-green-400" />
                : myApplication.status === 'rejected' ? <XCircle className="w-5 h-5 text-red-400" />
                : <Clock className="w-5 h-5 text-yellow-400" />}
              <div>
                <p className="font-semibold text-sm">Your Application: <span className="capitalize">{myApplication.status}</span></p>
                <p className="text-xs text-muted-foreground">{myApplication.cover_message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Apply Button / Form */}
        {canApply && !showApplyForm && (
          <Button className="w-full h-11" onClick={() => setShowApplyForm(true)}>
            Apply for this Job
          </Button>
        )}

        {showApplyForm && (
          <div className="glass rounded-2xl p-6 border border-primary/20 space-y-4">
            <h3 className="font-bold">Your Application</h3>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Cover Message *</label>
              <textarea
                value={applyForm.cover_message}
                onChange={e => setApplyForm(p => ({ ...p, cover_message: e.target.value }))}
                placeholder="Introduce yourself, explain why you're a great fit, relevant experience..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Your Rate ($)</label>
                <input type="number" value={applyForm.proposed_rate} onChange={e => setApplyForm(p => ({ ...p, proposed_rate: e.target.value }))}
                  placeholder="e.g. 35" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Available From</label>
                <input type="date" value={applyForm.available_from} onChange={e => setApplyForm(p => ({ ...p, available_from: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending || !applyForm.cover_message}>
                {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
              <Button variant="outline" className="border-white/10" onClick={() => setShowApplyForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Applications List (Owner Only) */}
        {showOwnerControls && applications.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-lg">Applications ({applications.length})</h2>
            {applications.map(app => {
              const profile = applicantProfiles.find(p => p?.user_email === app.applicant_email);
              return (
                <div key={app.id} className={`glass rounded-2xl p-5 border transition-all ${app.status === 'accepted' ? 'border-green-500/30' : 'border-white/5'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {app.applicant_name?.[0] || 'A'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{app.applicant_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{app.applicant_type}</span>
                            {profile?.rating > 0 && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-400" />{profile.rating.toFixed(1)}</span>}
                            {profile?.completed_jobs > 0 && <span>{profile.completed_jobs} jobs done</span>}
                          </div>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{app.cover_message}</p>
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        {app.proposed_rate && <span className="text-primary font-medium">${app.proposed_rate}</span>}
                        {app.available_from && <span>Available: {app.available_from}</span>}
                      </div>
                    </div>
                    {showOwnerControls && job.status === 'open' && app.status === 'pending' && (
                      <div className="flex flex-col gap-2">
                        <Link to={`/AvatarView?id=${profile?.id || ''}`}>
                          <Button size="sm" variant="outline" className="border-white/10 text-xs w-full">View Profile</Button>
                        </Link>
                        <Button size="sm" className="text-xs gap-1"
                          onClick={() => selectWinner.mutate(app)}
                          disabled={selectWinner.isPending}>
                          <Award className="w-3 h-3" /> Select
                        </Button>
                      </div>
                    )}
                    {app.status === 'accepted' && (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Winner Info (public) */}
        {job.winner_email && job.status !== 'open' && (
          <div className="glass rounded-2xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="font-semibold text-sm text-green-400">Job Assigned</p>
                <p className="text-xs text-muted-foreground">This job has been assigned to a selected applicant</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}