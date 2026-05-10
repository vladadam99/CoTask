import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import DatePicker from '@/components/jobs/DatePicker';
import TimePicker from '@/components/jobs/TimePicker';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  'City Guide', 'Property Walkthrough', 'Shopping Help', 'Event Attendance', 'Queue & Errands',
  'Family Support', 'Business Inspection', 'Training & Coaching', 'Travel Assistance', 'Pets & Animals',
  'Cars & Vehicles', 'Mechanics', 'Plumbing', 'Electrical Work', 'Medical & Health', 'Outdoors & Nature',
  'Cleaning', 'Gardening', 'Pick Ups', 'Deliveries', 'Cooking & Food', 'Dating & Social', 'Driving',
  'Show Me Around', 'Carers & Companionship', 'DIY & Repairs', 'Campus Help',
];
const EQUIPMENT_OPTIONS = ['Smartphone', '360° Camera', 'Drone', 'Laptop', 'Headset', 'Vehicle'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Arabic', 'Portuguese', 'Italian', 'Japanese', 'Other'];

export default function PostJob() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: 'City Guide', location: '',
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

  const submit = useMutation({
    mutationFn: async () => {
      const job = await base44.entities.JobPost.create({
        ...form,
        budget_min: form.budget ? Number(form.budget) : undefined,
        budget_max: form.budget ? Number(form.budget) : undefined,
        duration_type: form.budget_type === 'hourly' ? 'hourly' : 'custom',
        flexible_dates: form.timing_mode === 'flexible',
        scheduled_date: form.scheduled_date ? form.scheduled_date.toISOString().split('T')[0] : undefined,
        scheduled_time: form.scheduled_time || undefined,
        scheduled_time_end: form.scheduled_time_end || undefined,
        repeat: form.repeat || undefined,
        posted_by_email: user.email,
        posted_by_name: user.full_name,
        posted_by_type: user.role === 'enterprise' ? 'enterprise' : 'user',
        status: 'open',
        application_count: 0,
      });
      return job;
    },
    onSuccess: (job) => navigate(`/JobDetail?id=${job.id}`),
  });

  if (!user) return null;

  if (!user.identity_verified) {
    return (
      <AppShell navItems={getNavItems(user?.selected_role)} user={user}>
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
    <AppShell navItems={getNavItems(user?.selected_role)} user={user}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-primary/30 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Post a Job</h1>
            <p className="text-muted-foreground text-sm">Find the perfect avatar for your task</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Basic Info</p>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Job Title *</label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Check apartment in Paris" className="bg-white/5 border-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground">
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-card">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Location</label>
              <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="City, Country" className="bg-white/5 border-white/10" />
            </div>
          </div>
        </div>

        {/* When does this need to be done */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
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
          <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
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
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget</p>
          {/* Payment type */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Charge</span>
            {[{ key: 'fixed', label: 'for the whole job' }, { key: 'hourly', label: 'per hour' }].map(({ key, label }) => (
              <button key={key} type="button" onClick={() => set('budget_type', key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  form.budget_type === key ? 'bg-foreground text-background border-foreground' : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20'
                }`}>
                {label}
              </button>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Price ($){form.budget_type === 'hourly' ? '/hr' : ''}</label>
            <Input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="50" className="bg-white/5 border-white/10" />
          </div>
          <button type="button" onClick={() => set('negotiable', !form.negotiable)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all w-fit ${
              form.negotiable
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20'
            }`}>
            <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${form.negotiable ? 'border-primary' : 'border-muted-foreground'}`}>
              {form.negotiable && <span className="w-1.5 h-1.5 rounded-full bg-primary block" />}
            </span>
            Price is negotiable
          </button>
        </div>

        {/* Equipment */}
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Equipment Needed</p>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map(eq => (
              <button key={eq} onClick={() => toggleArr('equipment_needed', eq)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${form.equipment_needed.includes(eq) ? 'bg-primary/10 text-primary border-primary/30' : 'bg-white/5 text-muted-foreground border-white/10'}`}>
                {eq}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</p>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Describe the job in detail — what needs to be done, any specific requirements, expected outcome..."
            rows={4} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground" />
        </div>

        <Button className="w-full h-11" onClick={() => submit.mutate()} disabled={submit.isPending || !form.title || !form.description}>
          {submit.isPending ? 'Posting...' : 'Post Job'}
        </Button>
      </div>
    </AppShell>
  );
}