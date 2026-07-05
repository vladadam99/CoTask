import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Languages,
  Lock,
  MapPin,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import DatePicker from '@/components/jobs/DatePicker';
import TimePicker from '@/components/jobs/TimePicker';
import LocationAutocomplete from '@/components/jobs/LocationAutocomplete';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=82';

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

const EQUIPMENT_OPTIONS = ['Smartphone', 'Laptop', 'Headset', 'Vehicle'];
const COMING_SOON_EQUIPMENT = ['360 camera', 'Meta glasses'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Arabic', 'Portuguese', 'Italian', 'Japanese', 'Other'];

const TASK_FLAGS = [
  { key: 'remote_ok', title: 'Remote-friendly', hint: 'Can be done without visiting a place', icon: MapPin },
  { key: 'travel_required', title: 'Travel needed', hint: 'Agent may need to move around', icon: Briefcase },
  { key: 'camera_required', title: 'Photo or video proof', hint: 'Proof expected before approval', icon: Camera },
];

function formatDateValue(value) {
  if (!value) return 'Not set';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
}

function SectionHeader({ step, icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="section-label">{step}</p>
        <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

function LockedSection({ step, icon: Icon, title, description }) {
  return (
    <section className="rounded-lg border border-dashed border-border bg-card/60 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <Lock className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="section-label">{step}</p>
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <Icon className="ml-auto h-5 w-5 shrink-0 text-muted-foreground/60" />
      </div>
    </section>
  );
}

function ChoiceButton({ active, title, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-all ${
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/15'
          : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
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

function RequirementPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-xs font-semibold transition-all ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
      }`}
    >
      {children}
    </button>
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
  const [showLocation, setShowLocation] = useState(false);
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);

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
  const [skillInput, setSkillInput] = useState('');
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

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggleArr = (key, value) => setForm((prev) => ({
    ...prev,
    [key]: prev[key].includes(value) ? prev[key].filter((item) => item !== value) : [...prev[key], value],
  }));

  const addSkill = () => {
    const nextSkill = skillInput.trim();
    if (nextSkill && !form.skills_required.includes(nextSkill)) {
      setForm((prev) => ({ ...prev, skills_required: [...prev.skills_required, nextSkill] }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setForm((prev) => ({ ...prev, skills_required: prev.skills_required.filter((item) => item !== skill) }));
  };

  const basicsDone = Boolean(form.title?.trim() && form.category);
  const scheduleDone = form.timing_mode === 'flexible' || Boolean(form.scheduled_date);
  const budgetDone = Boolean(form.budget);
  const detailsDone = Boolean(form.description?.trim());
  const readyToPost = basicsDone && scheduleDone && budgetDone && detailsDone;

  const dateSummary = form.scheduled_date
    ? form.date_range_end
      ? `${formatDateValue(form.scheduled_date)} - ${formatDateValue(form.date_range_end)}`
      : formatDateValue(form.scheduled_date)
    : form.timing_mode === 'flexible'
      ? 'Flexible date'
      : 'Choose a date';
  const timeSummary = form.time_mode === 'flexible'
    ? form.scheduled_time_end ? `${form.scheduled_time_end} hour estimate` : 'Flexible time'
    : form.scheduled_time && form.scheduled_time_end
      ? `${form.scheduled_time} - ${form.scheduled_time_end}`
      : form.scheduled_time || 'Choose time';
  const budgetSummary = form.budget
    ? `$${form.budget}${form.budget_type === 'hourly' ? '/hr' : ''}${form.negotiable ? ' negotiable' : ''}`
    : 'Set budget';
  const activeEquipment = form.equipment_needed.filter((item) => EQUIPMENT_OPTIONS.includes(item));
  const selectedRequirements = [
    ...activeEquipment,
    ...form.languages_required,
    ...form.skills_required,
  ];

  const checklist = useMemo(() => ([
    { label: 'Title', done: Boolean(form.title?.trim()) },
    { label: 'Category', done: Boolean(form.category) },
    { label: 'Schedule', done: scheduleDone },
    { label: 'Budget', done: budgetDone },
    { label: 'Task details', done: detailsDone },
  ]), [budgetDone, detailsDone, form.category, form.title, scheduleDone]);
  const completedCount = checklist.filter((item) => item.done).length;

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
    equipment_needed: activeEquipment,
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

  const handleSubmit = () => {
    if (!form.title?.trim()) return toast({ title: 'Missing field', description: 'Please enter a task title.', variant: 'destructive' });
    if (!form.category) return toast({ title: 'Missing field', description: 'Please select a category.', variant: 'destructive' });
    if (!scheduleDone) return toast({ title: 'Missing field', description: 'Please choose a date or mark the task as flexible.', variant: 'destructive' });
    if (!form.budget) return toast({ title: 'Missing field', description: 'Please set a task budget.', variant: 'destructive' });
    if (!form.description?.trim()) return toast({ title: 'Missing field', description: 'Please describe what the agent should do.', variant: 'destructive' });
    submit.mutate();
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
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="p-4 md:p-6 lg:p-8">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-5 inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div className="max-w-2xl">
                <p className="section-label text-primary">Open task</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  {editJobId ? 'Edit your task' : 'Create a task agents can act on.'}
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  Start with the essentials. CoTask reveals the next step only when the task has enough information, so the page stays simple.
                </p>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-3">
                {[
                  { icon: FileText, label: 'Task type', value: form.category || 'Choose category' },
                  { icon: Calendar, label: 'Timing', value: dateSummary },
                  { icon: ShieldCheck, label: 'Payment', value: 'After agent chosen' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-border bg-secondary/40 p-3">
                    <item.icon className="mb-3 h-4 w-4 text-primary" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                    <p className="mt-1 truncate text-sm font-bold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[270px] overflow-hidden border-t border-border lg:border-l lg:border-t-0">
              <img src={HERO_IMAGE} alt="People planning a task together" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-white/20 bg-white/90 p-4 text-slate-950 shadow-xl backdrop-blur">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">Task preview</p>
                    <p className="text-xs text-slate-600">What agents will understand first</p>
                  </div>
                  <span className="rounded-full bg-teal-700 px-2.5 py-1 text-xs font-bold text-white">
                    {completedCount}/{checklist.length}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  {['What', 'When', 'Proof'].map((item) => (
                    <div key={item} className="rounded-md bg-slate-100 px-2 py-2 text-center">{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="space-y-4">
            <section className="surface-panel rounded-lg p-4 md:p-5">
              <SectionHeader
                step="Step 1"
                icon={FileText}
                title="Task basics"
                description="Only the essentials are visible first. Add a title and category to unlock the schedule."
              />

              <div className="mt-5 grid gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-foreground">Task title *</span>
                  <Input
                    id="task-title"
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="e.g. Inspect a two-bedroom apartment in Paris"
                    className="mt-1.5 h-12 bg-card text-base"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-foreground">Category *</span>
                  <select
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                    className="mt-1.5 h-12 w-full rounded-lg border border-input bg-card px-3.5 text-sm text-foreground shadow-sm focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="" className="bg-card text-muted-foreground">Select a category</option>
                    {CATEGORIES.map((category) => <option key={category} value={category} className="bg-card">{category}</option>)}
                  </select>
                </label>

                {showLocation || form.location ? (
                  <label className="block">
                    <span className="text-sm font-semibold text-foreground">Location</span>
                    <div className="mt-1.5">
                      <LocationAutocomplete value={form.location} onChange={(value) => set('location', value)} />
                    </div>
                  </label>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowLocation(true)}
                    className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-secondary/40 px-4 text-left text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Add location if agents need to visit somewhere
                    </span>
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </section>

            {basicsDone ? (
              <section className="surface-panel rounded-lg p-4 md:p-5">
                <SectionHeader
                  step="Step 2"
                  icon={Calendar}
                  title="Schedule"
                  description="Pick a quick date, custom date, or flexible timing. Repeat stays tucked away until you need it."
                />
                <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
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
                    repeat={form.repeat}
                    onRepeat={(value) => set('repeat', value)}
                  />
                </div>
              </section>
            ) : (
              <LockedSection
                step="Step 2"
                icon={Calendar}
                title="Schedule"
                description="Complete the task title and category first."
              />
            )}

            {basicsDone && scheduleDone ? (
              <section className="surface-panel rounded-lg p-4 md:p-5">
                <SectionHeader
                  step="Step 3"
                  icon={DollarSign}
                  title="Budget"
                  description="Give agents a clear number before they spend time writing proposals."
                />

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px]">
                  <div className="grid grid-cols-2 gap-2">
                    <ChoiceButton
                      active={form.budget_type === 'fixed'}
                      title="Whole task"
                      hint="One total price"
                      onClick={() => set('budget_type', 'fixed')}
                    />
                    <ChoiceButton
                      active={form.budget_type === 'hourly'}
                      title="Per hour"
                      hint="Useful when duration is uncertain"
                      onClick={() => set('budget_type', 'hourly')}
                    />
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold text-foreground">Price {form.budget_type === 'hourly' ? 'per hour' : ''}</span>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={form.budget}
                        onChange={(e) => set('budget', e.target.value)}
                        placeholder="50"
                        className="h-12 bg-card pl-8 text-base font-semibold"
                      />
                    </div>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => set('negotiable', !form.negotiable)}
                  className={`mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                    form.negotiable
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  <span className={`flex h-4 w-4 items-center justify-center rounded border ${form.negotiable ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                    {form.negotiable && <Check className="h-3 w-3" />}
                  </span>
                  Price is negotiable
                </button>
              </section>
            ) : (
              <LockedSection
                step="Step 3"
                icon={DollarSign}
                title="Budget"
                description="Choose the schedule first, then set a clear price."
              />
            )}

            {basicsDone && scheduleDone && budgetDone ? (
              <section className="surface-panel rounded-lg p-4 md:p-5">
                <SectionHeader
                  step="Step 4"
                  icon={ImageIcon}
                  title="Task details"
                  description="Tell the agent what to do, what to capture, and what a good result looks like."
                />
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Example: Walk through the apartment on live video, check natural light, windows, water pressure, street noise, building entrance, and upload photos of any damage."
                  rows={7}
                  className="mt-5 min-h-[180px] w-full resize-none rounded-lg border border-input bg-card px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </section>
            ) : (
              <LockedSection
                step="Step 4"
                icon={FileText}
                title="Task details"
                description="Set the budget first, then add the work instructions."
              />
            )}

            {detailsDone ? (
              <section className="surface-panel overflow-hidden rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowOptionalDetails((value) => !value)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left md:p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="section-label">Optional</p>
                      <h2 className="text-lg font-bold tracking-tight text-foreground">Agent requirements</h2>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Add only what truly matters. Most tasks do not need extra filters.
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${showOptionalDetails ? 'rotate-180' : ''}`} />
                </button>

                {showOptionalDetails && (
                  <div className="space-y-5 border-t border-border p-4 md:p-5">
                    <div className="grid gap-2 sm:grid-cols-3">
                      {TASK_FLAGS.map((flag) => {
                        const Icon = flag.icon;
                        const active = Boolean(form[flag.key]);
                        return (
                          <button
                            key={flag.key}
                            type="button"
                            onClick={() => set(flag.key, !active)}
                            className={`rounded-lg border p-3 text-left transition-all ${
                              active
                                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span className="text-sm font-bold">{flag.title}</span>
                            </div>
                            <p className="mt-1 text-xs leading-relaxed">{flag.hint}</p>
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                        <Camera className="h-4 w-4 text-primary" /> Equipment
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {EQUIPMENT_OPTIONS.map((equipment) => (
                          <RequirementPill
                            key={equipment}
                            active={form.equipment_needed.includes(equipment)}
                            onClick={() => toggleArr('equipment_needed', equipment)}
                          >
                            {equipment}
                          </RequirementPill>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {COMING_SOON_EQUIPMENT.map((equipment) => (
                          <span key={equipment} className="rounded-full border border-dashed border-border bg-secondary/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                            {equipment} coming soon
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                        <Languages className="h-4 w-4 text-primary" /> Languages
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map((language) => (
                          <RequirementPill
                            key={language}
                            active={form.languages_required.includes(language)}
                            onClick={() => toggleArr('languages_required', language)}
                          >
                            {language}
                          </RequirementPill>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                        <Sparkles className="h-4 w-4 text-primary" /> Skills
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              addSkill();
                            }
                          }}
                          placeholder="Add skill, e.g. property inspection"
                          className="h-11 bg-card"
                        />
                        <Button type="button" variant="outline" onClick={addSkill} className="h-11 shrink-0">
                          <Plus className="h-4 w-4" /> Add
                        </Button>
                      </div>
                      {form.skills_required.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {form.skills_required.map((skill) => (
                            <span key={skill} className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                              {skill}
                              <button type="button" onClick={() => removeSkill(skill)} className="text-primary/70 hover:text-primary">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <LockedSection
                step="Optional"
                icon={Sparkles}
                title="Agent requirements"
                description="Optional filters appear after the required task details are written."
              />
            )}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6">
            <div className="surface-panel overflow-hidden rounded-lg">
              <div className="border-b border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="section-label">Summary</p>
                    <h2 className="text-base font-bold text-foreground">Task snapshot</h2>
                  </div>
                  <div className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary">
                    {completedCount}/{checklist.length}
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(completedCount / checklist.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4 p-4">
                <div>
                  <h3 className="text-base font-bold leading-snug text-foreground">
                    {form.title?.trim() || 'Untitled task'}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {form.category || 'Choose category'}{form.location ? ` - ${form.location}` : ''}
                  </p>
                </div>

                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{dateSummary}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{timeSummary}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{budgetSummary}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {form.camera_required && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Camera proof</span>}
                  {form.travel_required && <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700">Travel</span>}
                  {form.remote_ok && <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-700">Remote-friendly</span>}
                  {selectedRequirements.slice(0, 6).map((item) => (
                    <span key={item} className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">{item}</span>
                  ))}
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  {checklist.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className={`inline-flex items-center gap-1 font-semibold ${item.done ? 'text-primary' : 'text-muted-foreground'}`}>
                        <CheckCircle2 className="h-4 w-4" />
                        {item.done ? 'Done' : 'Needed'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="leading-relaxed">Posting a task does not charge you. Payment is handed off after you choose an agent.</p>
                  </div>
                </div>

                <Button className="h-12 w-full text-base font-bold" onClick={handleSubmit} disabled={submit.isPending}>
                  {submit.isPending ? (editJobId ? 'Saving...' : 'Posting...') : (editJobId ? 'Save Task' : readyToPost ? 'Post Task for Proposals' : 'Complete Required Steps')}
                </Button>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Local Agents send proposals. You compare them, choose who to work with, then fund Secure Payment.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

