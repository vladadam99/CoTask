import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Languages,
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
  { key: 'remote_ok', title: 'Remote-friendly', hint: 'No complex travel', icon: MapPin },
  { key: 'travel_required', title: 'Travel needed', hint: 'Agent moves around', icon: Briefcase },
  { key: 'camera_required', title: 'Photo / video proof', hint: 'Proof expected', icon: Camera },
];

function formatDateValue(value) {
  if (!value) return 'Not set';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
}

function SectionHeader({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="section-label">{eyebrow}</p>
        <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>}
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
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', category: '', location: '',
    remote_ok: false, travel_required: false,
    budget: '', negotiable: false, budget_type: 'fixed',
    camera_required: false,
    timing_mode: 'dates',
    scheduled_date: null, scheduled_time: '',
    scheduled_time_end: '',
    time_mode: 'range',
    date_range_end: null,
    flexibility: 0,
    repeat: null,
    skills_required: [], languages_required: [], equipment_needed: [],
  });
  const [skillInput, setSkillInput] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!editJobId) return;
    base44.entities.JobPost.filter({ id: editJobId }).then(r => {
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

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const toggleArr = (key, value) => setForm(prev => ({
    ...prev,
    [key]: prev[key].includes(value) ? prev[key].filter(item => item !== value) : [...prev[key], value],
  }));

  const addSkill = () => {
    const nextSkill = skillInput.trim();
    if (nextSkill && !form.skills_required.includes(nextSkill)) {
      setForm(prev => ({ ...prev, skills_required: [...prev.skills_required, nextSkill] }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setForm(prev => ({ ...prev, skills_required: prev.skills_required.filter(item => item !== skill) }));
  };

  const dateSummary = form.scheduled_date
    ? form.date_range_end
      ? `${formatDateValue(form.scheduled_date)} - ${formatDateValue(form.date_range_end)}`
      : formatDateValue(form.scheduled_date)
    : 'Choose a date';
  const timeSummary = form.time_mode === 'flexible'
    ? form.scheduled_time_end ? `${form.scheduled_time_end} hour estimate` : 'Flexible time'
    : form.scheduled_time && form.scheduled_time_end
      ? `${form.scheduled_time} - ${form.scheduled_time_end}`
      : form.scheduled_time || 'Choose time';
  const budgetSummary = form.budget
    ? `$${form.budget}${form.budget_type === 'hourly' ? '/hr' : ''}${form.negotiable ? ' negotiable' : ''}`
    : 'Set budget';
  const activeEquipment = form.equipment_needed.filter(item => EQUIPMENT_OPTIONS.includes(item));
  const selectedRequirements = [
    ...activeEquipment,
    ...form.languages_required,
    ...form.skills_required,
  ];

  const checklist = [
    { label: 'Title', done: Boolean(form.title?.trim()) },
    { label: 'Category', done: Boolean(form.category) },
    { label: 'Schedule', done: Boolean(form.scheduled_date || form.timing_mode === 'flexible') },
    { label: 'Budget', done: Boolean(form.budget) },
    { label: 'Description', done: Boolean(form.description?.trim()) },
  ];
  const completedCount = checklist.filter(item => item.done).length;

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
    if (!form.description?.trim()) return toast({ title: 'Missing field', description: 'Please enter a description.', variant: 'destructive' });
    submit.mutate();
  };

  if (!user) return null;

  if (!user.identity_verified) {
    return (
      <AppShell navItems={getNavItems(shellRole)} user={user} roleOverride={shellRole} homePathOverride={shellHomePath}>
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 text-center gap-5">
          <div className="w-16 h-16 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Identity Verification Required</h2>
            <p className="text-muted-foreground text-sm max-w-sm">You must verify your identity before posting a task. This keeps the platform safe and trustworthy for everyone.</p>
          </div>
          <Button onClick={() => navigate('/IdentityVerification')}>Verify My Identity</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell navItems={getNavItems(shellRole)} user={user} roleOverride={shellRole} homePathOverride={shellHomePath}>
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="surface-panel rounded-lg p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-4 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
                <p className="section-label text-primary">Open task brief</p>
                <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {editJobId ? 'Refine your brief' : 'Create a Brief'}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Create a clear task brief so qualified Local Agents can send useful proposals.
                </p>
              </div>
            <div className="w-full lg:max-w-sm">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Brief progress</span>
                <span className="text-primary">{completedCount}/{checklist.length}</span>
              </div>
              <div className="h-2 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(completedCount / checklist.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
          <div className="space-y-4">
            <section className="surface-panel rounded-lg p-4 md:p-5 space-y-4">
              <SectionHeader
                icon={FileText}
                eyebrow="Step 1"
                title="Task basics"
                description="Name the task, choose the work type, and tell agents where it happens."
              />
              <div className="grid gap-4">
                <label className="block">
                  <span className="text-sm font-semibold text-foreground">Task title *</span>
                  <Input
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="e.g. Inspect a two-bedroom apartment in Paris"
                    className="mt-1.5 h-12 bg-card border-input text-base"
                  />
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-foreground">Category *</span>
                    <select
                      value={form.category}
                      onChange={(e) => set('category', e.target.value)}
                      className="mt-1.5 h-12 w-full rounded-lg border border-input bg-card px-3.5 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/45"
                    >
                      <option value="" className="bg-card text-muted-foreground">Select a category</option>
                      {CATEGORIES.map((category) => <option key={category} value={category} className="bg-card">{category}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-foreground">Location</span>
                    <div className="mt-1.5">
                      <LocationAutocomplete value={form.location} onChange={(value) => set('location', value)} />
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-bold">{flag.title}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed">{flag.hint}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="surface-panel rounded-lg p-4 md:p-5 space-y-4">
              <SectionHeader
                icon={Calendar}
                eyebrow="Step 2"
                title="Schedule"
                description="Choose a date, time window, or flexible duration."
              />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
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

            <section className="surface-panel rounded-lg p-4 md:p-5 space-y-4">
              <SectionHeader
                icon={DollarSign}
                eyebrow="Step 3"
                title="Budget / Secure Payment"
                description="Set the amount agents should use when deciding whether to propose. You only fund Secure Payment after choosing who to work with."
              />
              <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4 items-start">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'fixed', title: 'Whole task', hint: 'One total price' },
                    { key: 'hourly', title: 'Per hour', hint: 'Best for unknown duration' },
                  ].map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => set('budget_type', option.key)}
                      className={`rounded-lg border p-4 text-left transition-all ${
                        form.budget_type === option.key
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      }`}
                    >
                      <span className="block text-sm font-bold">{option.title}</span>
                      <span className="block mt-1 text-xs">{option.hint}</span>
                    </button>
                  ))}
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
                      className="h-12 bg-card border-input pl-8 text-base font-semibold"
                    />
                  </div>
                </label>
              </div>
              <button
                type="button"
                onClick={() => set('negotiable', !form.negotiable)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                  form.negotiable
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                <span className={`h-4 w-4 rounded border flex items-center justify-center ${form.negotiable ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                  {form.negotiable && <CheckCircle2 className="w-3 h-3" />}
                </span>
                Price is negotiable
              </button>
            </section>

            <section className="surface-panel rounded-lg p-4 md:p-5 space-y-4">
              <SectionHeader
                icon={FileText}
                eyebrow="Step 4"
                title="Task details"
                description="Describe the outcome, proof needed, access instructions, and anything agents must avoid."
              />
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Example: Walk through the apartment on live video, check natural light, windows, water pressure, noise from the street, building entrance, and upload photos of any damage."
                rows={7}
                className="w-full min-h-[180px] resize-none rounded-lg border border-input bg-card px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/45"
              />
            </section>

            <section className="surface-panel rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowOptionalDetails(value => !value)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left md:p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="section-label">Optional</p>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">Agent requirements</h2>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Add these only when they matter. Most tasks can be posted without extra filters.
                    </p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${showOptionalDetails ? 'rotate-180' : ''}`} />
              </button>

              {showOptionalDetails && (
                <div className="border-t border-border p-4 md:p-5 space-y-5">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-2">
                      <Camera className="w-4 h-4 text-primary" /> Equipment
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {EQUIPMENT_OPTIONS.map((equipment) => (
                        <button
                          key={equipment}
                          type="button"
                          onClick={() => toggleArr('equipment_needed', equipment)}
                          className={`rounded-full border px-3 py-2 text-xs font-semibold transition-all ${
                            form.equipment_needed.includes(equipment)
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                          }`}
                        >
                          {equipment}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {COMING_SOON_EQUIPMENT.map((equipment) => (
                        <span key={equipment} className="rounded-full border border-dashed border-border bg-secondary/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                          {equipment} coming later
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-2">
                      <Languages className="w-4 h-4 text-primary" /> Languages
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map((language) => (
                        <button
                          key={language}
                          type="button"
                          onClick={() => toggleArr('languages_required', language)}
                          className={`rounded-full border px-3 py-2 text-xs font-semibold transition-all ${
                            form.languages_required.includes(language)
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                          }`}
                        >
                          {language}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-2">
                      <Sparkles className="w-4 h-4 text-primary" /> Skills
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
                        className="h-11 bg-card border-input"
                      />
                      <Button type="button" variant="outline" onClick={addSkill} className="h-11 shrink-0">
                        <Plus className="w-4 h-4" /> Add
                      </Button>
                    </div>
                    {form.skills_required.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {form.skills_required.map((skill) => (
                          <span key={skill} className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                            {skill}
                            <button type="button" onClick={() => removeSkill(skill)} className="text-primary/70 hover:text-primary">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="xl:sticky xl:top-6 space-y-4">
            <div className="surface-panel rounded-lg overflow-hidden">
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
              </div>

              <div className="p-4 space-y-4">
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
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">{dateSummary}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">{timeSummary}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
                    <DollarSign className="w-4 h-4 text-primary" />
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
                        <CheckCircle2 className="w-4 h-4" />
                        {item.done ? 'Done' : 'Needed'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="leading-relaxed">Payment is only handed off after you choose an agent. Posting this task does not charge you.</p>
                  </div>
                </div>

                <Button className="w-full h-12 text-base" onClick={handleSubmit} disabled={submit.isPending}>
                  {submit.isPending ? (editJobId ? 'Saving...' : 'Sending...') : (editJobId ? 'Save Changes' : 'Send Brief for Proposals')}
                </Button>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Open Tasks work best when you want several Local Agents to respond. Compare proposals, choose who to work with, then fund Secure Payment.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

