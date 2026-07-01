import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import DatePicker from '@/components/jobs/DatePicker';
import TimePicker from '@/components/jobs/TimePicker';
import LocationAutocomplete from '@/components/jobs/LocationAutocomplete';

const CATEGORIES = [
  'Business Inspection', 'Campus Help', 'Carers & Companionship', 'Cars & Vehicles', 'City Guide',
  'Cleaning', 'Cooking & Food', 'Dating & Social', 'Deliveries', 'DIY & Repairs',
  'Driving', 'Electrical Work', 'Event Attendance', 'Family Support', 'Gardening',
  'Medical & Health', 'Mechanics', 'Outdoors & Nature', 'Pets & Animals', 'Pick Ups',
  'Plumbing', 'Property Walkthrough', 'Queue & Errands', 'Shopping Help', 'Show Me Around',
  'Training & Coaching', 'Travel Assistance',
];
const EQUIPMENT_OPTIONS = ['Smartphone', '360° Camera', 'Drone', 'Laptop', 'Headset', 'Vehicle'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Arabic', 'Portuguese', 'Italian', 'Japanese', 'Other'];

export default function PostJob() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const editJobId = urlParams.get('edit');
  const activeRole = user?.selected_role || user?.role || 'user';

  const [form, setForm] = useState({
    title: '', description: '', category: '', location: '',
    remote_ok: false, travel_required: false,
    budget: '', negotiable: false, budget_type: 'fixed',
    camera_required: false,
    timing_mode: 'dates',
    scheduled_date: null, scheduled_time: '',
    scheduled_time_end: '',
    time_mode: 'specific',
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
        time_mode: job.duration_value ? 'flexible' : (job.scheduled_time ? 'range' : 'specific'),
        date_range_end: null,
        flexibility: 0,
        repeat: job.repeat || null,
        skills_required: job.skills_required || [],
        languages_required: job.languages_required || [],
        equipment_needed: job.equipment_needed || [],
      });
    });
  }, [editJobId]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleArr = (key, val) => setForm(p => ({
    ...p, [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val]
  }));

  const addSkill = () => {
    if (skillInput.trim() && !form.skills_required.includes(skillInput.trim())) {
      setForm(p => ({ ...p, skills_required: [...p.skills_required, skillInput.trim()] }));
      setSkillInput('');
    }
  };

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
    equipment_needed: form.equipment_needed,
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
        title: 'Error posting job',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  if (!user) return null;

  if (!user.identity_verified) {
    return (
      <AppShell navItems={getNavItems(activeRole)} user={user}>
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-24 text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Identity Verification Required</h2>
            <p className="text-muted-foreground text-sm max-w-sm">You must verify your identity before posting a job. This keeps the platform safe and trustworthy for everyone.</p>
          </div>
          <Button onClick={() => navigate('/IdentityVerification')}>
            Verify My Identity
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell navItems={getNavItems(activeRole)} user={user}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-background border border-input flex items-center justify-center hover:border-primary/30 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{editJobId ? 'Edit Open Task' : 'Post an Open Task'}</h1>
            <p className="text-muted-foreground text-sm">{editJobId ? 'Update your task details' : 'Describe what you need done and let qualified Local Agents submit proposals.'}</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="glass rounded-2xl p-6 border border-border space-y-4 relative z-10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Basic Info</p>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Task Title *</label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Check apartment in Paris" className="bg-background border-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full bg-background border border-input rounded-lg px-3.5 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/45 text-foreground">
                <option value="" className="bg-card text-muted-foreground">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-card">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Location</label>
              <LocationAutocomplete value={form.location} onChange={v => set('location', v)} />
            </div>
          </div>
        </div>

        {/* When does this need to be done */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-6 border border-border space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</p>
            <DatePicker
              mode={form.timing_mode}
              onModeChange={v => set('timing_mode', v)}
              startDate={form.scheduled_date}
              endDate={form.date_range_end}
              onStartDate={v => set('scheduled_date', v)}
              onEndDate={v => set('date_range_end', v)}
              flexibility={form.flexibility}
              onFlexibility={v => set('flexibility', v)}
            />
          </div>
          <div className="glass rounded-2xl p-6 border border-border space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</p>
            <TimePicker
              timeMode={form.time_mode}
              onTimeMode={v => set('time_mode', v)}
              startTime={form.scheduled_time}
              onStartTime={v => set('scheduled_time', v)}
              endTime={form.scheduled_time_end}
              onEndTime={v => set('scheduled_time_end', v)}
              repeat={form.repeat}
              onRepeat={v => set('repeat', v)}
            />
          </div>
        </div>

        {/* Budget */}
        <div className="glass rounded-2xl p-6 border border-border space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget / Secure Payment</p>
          {/* Payment type */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Charge</span>
            {[{ key: 'fixed', label: 'for the whole task' }, { key: 'hourly', label: 'per hour' }].map(({ key, label }) => (
              <button key={key} type="button" onClick={() => set('budget_type', key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  form.budget_type === key ? 'bg-foreground text-background border-foreground' : 'bg-background text-muted-foreground border-input hover:border-foreground/20'
                }`}>
                {label}
              </button>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Price ($){form.budget_type === 'hourly' ? '/hr' : ''}</label>
            <Input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="50" className="bg-background border-input" />
          </div>
          <button type="button" onClick={() => set('negotiable', !form.negotiable)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all w-fit ${
              form.negotiable
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-background text-muted-foreground border-input hover:border-foreground/20'
            }`}>
            <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.negotiable ? 'border-primary' : 'border-muted-foreground'}`}>
              {form.negotiable && <span className="w-1.5 h-1.5 rounded-full bg-primary block" />}
            </span>
            Price is negotiable
          </button>
        </div>

        {/* Equipment */}
        <div className="glass rounded-2xl p-6 border border-border space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Equipment Needed</p>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map(eq => (
              <button key={eq} onClick={() => toggleArr('equipment_needed', eq)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${form.equipment_needed.includes(eq) ? 'bg-primary/10 text-primary border-primary/30' : 'bg-background text-muted-foreground border-input'}`}>
                {eq}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="glass rounded-2xl p-6 border border-border space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</p>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Describe the task in detail — what needs to be done, any specific requirements, expected outcome..."
            rows={4} className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground" />
        </div>

        <Button 
          className="w-full h-11" 
          onClick={() => {
            if (!form.title?.trim()) return toast({ title: 'Missing Field', description: 'Please enter a task title.', variant: 'destructive' });
            if (!form.category) return toast({ title: 'Missing Field', description: 'Please select a category.', variant: 'destructive' });
            if (!form.description?.trim()) return toast({ title: 'Missing Field', description: 'Please enter a description.', variant: 'destructive' });
            submit.mutate();
          }} 
          disabled={submit.isPending}
        >
          {submit.isPending ? (editJobId ? 'Saving...' : 'Posting...') : (editJobId ? 'Save Changes' : 'Post Open Task')}
        </Button>
        <p className="text-xs text-center text-muted-foreground pt-2 pb-6">
          Open Tasks are best when you want several Local Agents to respond. Local Agents submit proposals. You choose who to work with before funding Secure Payment.
        </p>
      </div>
    </AppShell>
  );
}