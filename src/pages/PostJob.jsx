import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Check,
  ChevronRight,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import DatePicker from '@/components/jobs/DatePicker';
import TimePicker from '@/components/jobs/TimePicker';
import LocationAutocomplete from '@/components/jobs/LocationAutocomplete';

const STEP_VISUALS = {
  what: {
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=82',
    eyebrow: 'What',
    title: 'Name the task clearly',
    hint: 'A simple title and category helps the right Local Agents understand the job fast.',
  },
  when: {
    image: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=1200&q=82',
    eyebrow: 'When',
    title: 'Choose the time window',
    hint: 'Pick a date, time, or flexible window so agents know when they need to be ready.',
  },
  where: {
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=82',
    eyebrow: 'Where',
    title: 'Set the place',
    hint: 'Add the city, address area, or mark it remote-friendly when no visit is needed.',
  },
  budget: {
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=82',
    eyebrow: 'Budget',
    title: 'Set a fair payment',
    hint: 'Give agents a clear starting point. You can still negotiate after proposals arrive.',
  },
  details: {
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=82',
    eyebrow: 'Details',
    title: 'Explain the outcome',
    hint: 'Say what success looks like, what to check, and what proof you expect.',
  },
};

const CATEGORIES = [
  'Property Walkthrough',
  'Business Inspection',
  'Queue & Errands',
  'Shopping Help',
  'Deliveries',
  'Travel Assistance',
  'Event Attendance',
  'Cars & Vehicles',
  'City Guide',
  'DIY & Repairs',
  'Other Local Help',
];

function ChoiceButton({ active, title, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-all ${
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/15'
          : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-secondary/60 hover:text-foreground'
      }`}
    >
      <span className="flex items-center justify-between gap-3 text-sm font-bold">
        {title}
        {active && <Check className="h-4 w-4" />}
      </span>
      <span className={`mt-1 block text-xs leading-relaxed ${active ? 'text-primary-foreground/80' : ''}`}>{hint}</span>
    </button>
  );
}

function StepHeader({ visual, progress }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div
        className="relative min-h-[140px] bg-cover bg-center sm:min-h-[160px]"
        style={{ backgroundImage: `url(${visual.image})` }}
        aria-label={`${visual.eyebrow} task step`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
      </div>
      <div className="bg-card px-3 py-3 sm:px-4">
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center gap-3">
          <p className="text-sm font-black text-foreground">{visual.eyebrow}</p>
        </div>
      </div>
    </div>
  );
}

export default function PostJob() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const editJobId = urlParams.get('edit');
  const activeRole = user?.selected_role || user?.role || 'user';
  const shellRole = activeRole === 'avatar' ? 'user' : activeRole;
  const shellHomePath = shellRole === 'user' ? '/Explore' : undefined;
  const [activePanel, setActivePanel] = useState('what');
  const composerScrollRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    remote_ok: false,
    travel_required: false,
    budget: '',
    negotiable: false,
    budget_type: 'fixed',
    camera_required: false,
    timing_mode: 'dates',
    scheduled_date: null,
    scheduled_time: '',
    scheduled_time_end: '',
    time_mode: 'range',
    date_range_end: null,
    flexibility: 0,
    repeat: null,
    skills_required: [],
    languages_required: [],
    equipment_needed: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!editJobId) return;
    base44.entities.JobPost.filter({ id: editJobId }).then((r) => {
      const job = r[0];
      if (!job) return;
      setForm({
        title: job.title || '',
        description: job.description || '',
        category: job.category || '',
        location: job.location || '',
        remote_ok: job.remote_ok || false,
        travel_required: job.travel_required || false,
        budget: job.budget_min || '',
        negotiable: job.negotiable || false,
        budget_type: job.duration_type === 'hourly' ? 'hourly' : 'fixed',
        camera_required: job.camera_required || false,
        timing_mode: job.flexible_dates ? 'flexible' : 'dates',
        scheduled_date: job.scheduled_date ? new Date(job.scheduled_date) : null,
        scheduled_time: job.scheduled_time || '',
        scheduled_time_end: job.duration_value ? String(job.duration_value) : (job.scheduled_time_end || ''),
        time_mode: job.duration_value ? 'flexible' : 'range',
        date_range_end: null,
        flexibility: 0,
        repeat: job.repeat || null,
        skills_required: job.skills_required || [],
        languages_required: job.languages_required || [],
        equipment_needed: job.equipment_needed || [],
      });
    });
  }, [editJobId]);

  useEffect(() => {
    composerScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePanel]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const whatDone = Boolean(form.title?.trim() && form.category);
  const whenDone = form.timing_mode === 'flexible' || Boolean(form.scheduled_date);
  const whereDone = Boolean(form.remote_ok || form.location?.trim());
  const budgetDone = Boolean(form.budget);
  const detailsDone = Boolean(form.description?.trim());
  const readyToPost = whatDone && whenDone && whereDone && budgetDone && detailsDone;

  const steps = useMemo(() => ([
    { key: 'what', label: 'What', done: whatDone },
    { key: 'when', label: 'When', done: whenDone },
    { key: 'where', label: 'Where', done: whereDone },
    { key: 'budget', label: 'Budget', done: budgetDone },
    { key: 'details', label: 'Details', done: detailsDone },
  ]), [budgetDone, detailsDone, whatDone, whenDone, whereDone]);
  const completedCount = steps.filter((item) => item.done).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const activeVisual = STEP_VISUALS[activePanel] || STEP_VISUALS.what;

  const jobPayload = {
    title: form.title,
    description: form.description,
    category: form.category,
    location: form.location,
    remote_ok: form.remote_ok,
    travel_required: form.travel_required,
    camera_required: form.camera_required,
    negotiable: form.negotiable,
    skills_required: form.skills_required,
    languages_required: form.languages_required,
    equipment_needed: form.equipment_needed || [],
    budget_min: form.budget ? Number(form.budget) : undefined,
    budget_max: form.budget ? Number(form.budget) : undefined,
    duration_type: form.budget_type === 'hourly' ? 'hourly' : 'custom',
    duration_value: form.time_mode === 'flexible' && form.scheduled_time_end ? Number(form.scheduled_time_end) : undefined,
    flexible_dates: form.timing_mode === 'flexible',
    scheduled_date: form.scheduled_date ? (form.scheduled_date instanceof Date ? form.scheduled_date.toISOString().split('T')[0] : form.scheduled_date) : undefined,
    scheduled_time: form.scheduled_time || undefined,
    repeat: form.repeat || undefined,
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (editJobId) {
        await base44.functions.invoke('updateJobPost', { jobId: editJobId, updates: jobPayload });
        return { id: editJobId };
      }
      const job = await base44.entities.JobPost.create({
        ...jobPayload,
        posted_by_email: user.email,
        posted_by_name: user.full_name,
        posted_by_type: activeRole === 'enterprise' ? 'enterprise' : 'user',
        status: 'open',
        application_count: 0,
      });
      return job;
    },
    onSuccess: (job) => {
      queryClient.setQueryData(['job-detail', job.id], job);
      navigate(`/JobDetail?id=${job.id}`);
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: 'Error posting task',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  const scrollComposerTop = () => {
    window.setTimeout(() => {
      composerScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  };

  const activatePanel = (panel) => {
    setActivePanel(panel);
    scrollComposerTop();
  };

  const focusMissing = (panel, title, description) => {
    activatePanel(panel);
    toast({ title, description, variant: 'destructive' });
  };

  const handleSubmit = () => {
    if (!form.title?.trim() || !form.category) {
      return focusMissing('what', 'Task basics missing', 'Add a task title and category.');
    }
    if (!whenDone) {
      return focusMissing('when', 'Timing missing', 'Choose a date or mark the task as flexible.');
    }
    if (!whereDone) {
      return focusMissing('where', 'Location missing', 'Add where the task is needed or mark it remote-friendly.');
    }
    if (!form.budget) {
      return focusMissing('budget', 'Budget missing', 'Set the task budget.');
    }
    if (!form.description?.trim()) {
      return focusMissing('details', 'Task details missing', 'Describe what the agent should do.');
    }
    submit.mutate();
  };

  const goNext = () => {
    const idx = steps.findIndex((step) => step.key === activePanel);
    activatePanel(steps[Math.min(idx + 1, steps.length - 1)].key);
  };

  const renderPanel = () => {
    if (activePanel === 'what') {
      return (
        <div className="grid gap-4">
          <label className="block">
            <span className="text-sm font-bold text-foreground">Task title *</span>
            <Input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Inspect a two-bedroom apartment in Paris"
              className="mt-1.5 h-12 bg-card text-base"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-foreground">Category *</span>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="mt-1.5 h-12 w-full rounded-lg border border-input bg-card px-3.5 text-sm font-semibold text-foreground shadow-sm focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="" className="bg-card text-muted-foreground">Select category</option>
              {CATEGORIES.map((category) => <option key={category} value={category} className="bg-card">{category}</option>)}
            </select>
          </label>
        </div>
      );
    }

    if (activePanel === 'when') {
      return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <DatePicker
            mode={form.timing_mode}
            onModeChange={(value) => set('timing_mode', value)}
            startDate={form.scheduled_date}
            endDate={form.date_range_end}
            onStartDate={(value) => set('scheduled_date', value)}
            onEndDate={(value) => set('date_range_end', value)}
            flexibility={form.flexibility}
            onFlexibility={(value) => set('flexibility', value)}
          />
          <TimePicker
            timeMode={form.time_mode}
            onTimeMode={(value) => set('time_mode', value)}
            startTime={form.scheduled_time}
            onStartTime={(value) => set('scheduled_time', value)}
            endTime={form.scheduled_time_end}
            onEndTime={(value) => set('scheduled_time_end', value)}
          />
        </div>
      );
    }

    if (activePanel === 'where') {
      return (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <label className="block">
            <span className="text-sm font-bold text-foreground">Where is the task needed?</span>
            <div className="mt-1.5">
              <LocationAutocomplete value={form.location} onChange={(value) => set('location', value)} />
            </div>
          </label>
          <div className="grid gap-2">
            <ChoiceButton
              active={form.remote_ok}
              title="Remote-friendly"
              hint="Use this if an exact place is not needed."
              onClick={() => set('remote_ok', !form.remote_ok)}
            />
          </div>
        </div>
      );
    }

    if (activePanel === 'budget') {
      return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="grid grid-cols-2 gap-2">
            <ChoiceButton
              active={form.budget_type === 'fixed'}
              title="Whole task"
              hint="One clear price for the work."
              onClick={() => set('budget_type', 'fixed')}
            />
            <ChoiceButton
              active={form.budget_type === 'hourly'}
              title="Per hour"
              hint="Use when duration is uncertain."
              onClick={() => set('budget_type', 'hourly')}
            />
          </div>

          <label className="block">
            <span className="text-sm font-bold text-foreground">Price {form.budget_type === 'hourly' ? 'per hour' : ''}</span>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground">$</span>
              <Input
                type="number"
                value={form.budget}
                onChange={(e) => set('budget', e.target.value)}
                placeholder="50"
                className="h-12 bg-card pl-8 text-base font-bold"
              />
            </div>
            <button
              type="button"
              onClick={() => set('negotiable', !form.negotiable)}
              className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition-all ${
                form.negotiable
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              <span className={`flex h-4 w-4 items-center justify-center rounded border ${form.negotiable ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                {form.negotiable && <Check className="h-3 w-3" />}
              </span>
              Negotiable
            </button>
          </label>
        </div>
      );
    }

    if (activePanel === 'details') {
      return (
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Example: Walk through the apartment on live video, check natural light, windows, water pressure, street noise, building entrance, and upload photos of any damage."
          rows={7}
          className="min-h-[190px] w-full resize-none rounded-lg border border-input bg-card px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      );
    }

    return null;
  };

  if (!user) return null;

  if (!user.identity_verified) {
    return (
      <AppShell navItems={getNavItems(shellRole)} user={user} roleOverride={shellRole} homePathOverride={shellHomePath}>
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-5 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-yellow-500/10">
            <ShieldAlert className="h-8 w-8 text-yellow-500" />
          </div>
          <div>
            <h2 className="mb-2 text-xl font-bold">Identity Verification Required</h2>
            <p className="max-w-sm text-sm text-muted-foreground">You must verify your identity before posting a task. This keeps the platform safe and trustworthy for everyone.</p>
          </div>
          <Button onClick={() => navigate('/IdentityVerification')}>Verify My Identity</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell navItems={getNavItems(shellRole)} user={user} roleOverride={shellRole} homePathOverride={shellHomePath}>
      <div className="mx-auto max-w-6xl">
        <div className="sticky top-16 z-30 lg:top-4">
          <section className="overflow-hidden rounded-lg border border-border bg-card shadow-2xl shadow-slate-950/10">
            <div ref={composerScrollRef} className="max-h-[calc(100svh-7.25rem)] overflow-y-auto">
              <div className="sticky top-0 z-20 border-b border-border bg-card p-3 sm:p-4">
                <StepHeader visual={activeVisual} progress={progressPercent} />
              </div>

              <div className="grid gap-4 p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_240px]">
                <div className="min-h-[260px] rounded-lg border border-border bg-background/55 p-4">
                    {renderPanel()}
                </div>

                <aside className="space-y-3">
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                      <p className="leading-relaxed">Posting is free. Payment happens after you choose an agent.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" className="h-11 border-border" onClick={goNext}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button className="h-11 font-bold" onClick={handleSubmit} disabled={submit.isPending}>
                      {submit.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Posting</>
                      ) : editJobId ? (
                        'Save'
                      ) : readyToPost ? (
                        'Post'
                      ) : (
                        'Finish'
                      )}
                    </Button>
                  </div>
                </aside>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

