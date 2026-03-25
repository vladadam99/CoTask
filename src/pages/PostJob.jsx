import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORIES = ['Shopping', 'Delivery', 'Real Estate', 'Tourism', 'Events', 'Inspection', 'Translation', 'Other'];
const DURATION_TYPES = ['hourly', 'daily', 'weekly', 'monthly', 'custom'];
const EQUIPMENT_OPTIONS = ['Smartphone', '360° Camera', 'Drone', 'Laptop', 'Headset', 'Vehicle'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Arabic', 'Portuguese', 'Italian', 'Japanese', 'Other'];

export default function PostJob() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: 'Shopping', location: '',
    remote_ok: false, travel_required: false,
    duration_type: 'hourly', duration_value: 1,
    budget_min: '', budget_max: '', negotiable: true,
    camera_required: false, flexible_dates: true, scheduled_date: '',
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
        budget_min: form.budget_min ? Number(form.budget_min) : undefined,
        budget_max: form.budget_max ? Number(form.budget_max) : undefined,
        duration_value: Number(form.duration_value),
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

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/JobMarketplace">
            <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-primary/30 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Post a Job</h1>
            <p className="text-muted-foreground text-sm">Find the perfect avatar for your task</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/5 space-y-5">
          {/* Basic Info */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Job Title *</label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Check apartment in Paris" className="bg-white/5 border-white/10" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Describe the job in detail — what needs to be done, any specific requirements, expected outcome..."
              rows={4} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground" />
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

          {/* Duration & Budget */}
          <div>
            <label className="text-sm font-medium mb-2 block">Duration</label>
            <div className="flex gap-2 items-center">
              <Input type="number" min="1" value={form.duration_value} onChange={e => set('duration_value', e.target.value)}
                className="bg-white/5 border-white/10 w-24" />
              <div className="flex gap-1">
                {DURATION_TYPES.map(d => (
                  <button key={d} onClick={() => set('duration_type', d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.duration_type === d ? 'bg-primary text-white' : 'bg-white/5 border border-white/10 text-muted-foreground'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Budget Min ($)</label>
              <Input type="number" value={form.budget_min} onChange={e => set('budget_min', e.target.value)} placeholder="20" className="bg-white/5 border-white/10" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Budget Max ($)</label>
              <Input type="number" value={form.budget_max} onChange={e => set('budget_max', e.target.value)} placeholder="100" className="bg-white/5 border-white/10" />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'negotiable', label: 'Price Negotiable' },
              { key: 'remote_ok', label: 'Remote OK' },
              { key: 'travel_required', label: 'Travel Required' },
              { key: 'camera_required', label: 'Live Camera Required' },
              { key: 'flexible_dates', label: 'Flexible Dates' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => set(key, !form[key])}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form[key] ? 'bg-primary/10 text-primary border-primary/30' : 'bg-white/5 text-muted-foreground border-white/10'}`}>
                {form[key] ? '✓ ' : ''}{label}
              </button>
            ))}
          </div>

          {/* Date (if not flexible) */}
          {!form.flexible_dates && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Scheduled Date</label>
              <Input type="date" value={form.scheduled_date} onChange={e => set('scheduled_date', e.target.value)} className="bg-white/5 border-white/10" />
            </div>
          )}

          {/* Skills */}
          <div>
            <label className="text-sm font-medium mb-2 block">Skills Required</label>
            <div className="flex gap-2 mb-2">
              <Input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                placeholder="Type a skill and press Enter" className="bg-white/5 border-white/10" />
              <Button size="sm" variant="outline" className="border-white/10" onClick={addSkill}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.skills_required.map(s => (
                <span key={s} className="flex items-center gap-1 text-xs bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
                  {s}
                  <button onClick={() => setForm(p => ({ ...p, skills_required: p.skills_required.filter(x => x !== s) }))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <label className="text-sm font-medium mb-2 block">Languages Needed</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(l => (
                <button key={l} onClick={() => toggleArr('languages_required', l)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${form.languages_required.includes(l) ? 'bg-primary/10 text-primary border-primary/30' : 'bg-white/5 text-muted-foreground border-white/10'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="text-sm font-medium mb-2 block">Equipment Needed</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map(eq => (
                <button key={eq} onClick={() => toggleArr('equipment_needed', eq)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${form.equipment_needed.includes(eq) ? 'bg-primary/10 text-primary border-primary/30' : 'bg-white/5 text-muted-foreground border-white/10'}`}>
                  {eq}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button className="w-full h-11" onClick={() => submit.mutate()} disabled={submit.isPending || !form.title || !form.description}>
          {submit.isPending ? 'Posting...' : 'Post Job'}
        </Button>
      </div>
    </AppShell>
  );
}