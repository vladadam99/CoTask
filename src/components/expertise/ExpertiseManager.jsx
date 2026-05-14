import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Pencil, BookOpen, Check, X } from 'lucide-react';
import OfficeHoursManager from './OfficeHoursManager';

const TOPICS = [
  'Technology', 'Business', 'Language Learning', 'Health & Wellness',
  'Creative Arts', 'Finance', 'Law & Legal', 'Education',
  'Marketing', 'Science', 'Cooking', 'Music', 'Career Advice', 'Other',
];

const SESSION_TYPES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'class', label: 'Class' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'qa_session', label: 'Q&A Session' },
  { value: 'mentoring', label: 'Mentoring' },
];

const DEFAULT_OFFICE_HOURS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => ({
  day,
  enabled: ['Monday','Tuesday','Wednesday','Thursday','Friday'].includes(day),
  from: '09:00',
  to: '17:00',
}));

const BLANK = {
  title: '', description: '', topic: 'Technology',
  session_type: 'consultation', duration_minutes: 60, rate: '', office_hours: DEFAULT_OFFICE_HOURS,
};

export default function ExpertiseManager({ profile, user }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK);

  const { data: offerings = [] } = useQuery({
    queryKey: ['my-expertise-offerings', user?.email],
    queryFn: async () => {
      const list = await base44.entities.ExpertiseOffering.filter({ avatar_email: user.email }, '-created_date', 50);
      // Back-fill office hours for any offering that was saved without them
      for (const o of list) {
        if (!o.office_hours || o.office_hours.length === 0) {
          base44.entities.ExpertiseOffering.update(o.id, { office_hours: DEFAULT_OFFICE_HOURS }).catch(() => {});
        }
      }
      return list;
    },
    enabled: !!user,
  });

  const createOffering = useMutation({
    mutationFn: (data) => base44.entities.ExpertiseOffering.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-expertise-offerings'] });
      queryClient.invalidateQueries({ queryKey: ['expertise-offerings'] });
      setShowForm(false);
      setForm(BLANK);
      toast({ title: '✅ Offering saved!', description: 'Your new offering is now live.' });
    },
    onError: (err) => {
      toast({ title: 'Save failed', description: err?.message || 'Could not save offering.', variant: 'destructive' });
    },
  });

  const updateOffering = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ExpertiseOffering.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-expertise-offerings'] });
      queryClient.invalidateQueries({ queryKey: ['expertise-offerings'] });
      setEditingId(null);
      setShowForm(false);
      setForm(BLANK);
      toast({ title: '✅ Offering updated!' });
    },
    onError: (err) => {
      toast({ title: 'Update failed', description: err?.message || 'Could not update offering.', variant: 'destructive' });
    },
  });

  const deleteOffering = useMutation({
    mutationFn: (id) => base44.entities.ExpertiseOffering.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-expertise-offerings'] });
      queryClient.invalidateQueries({ queryKey: ['expertise-offerings'] });
      toast({ title: 'Offering removed' });
    },
  });

  const handleSubmit = () => {
    if (!form.title) {
      toast({ title: 'Title required', description: 'Please enter a title for your offering.', variant: 'destructive' });
      return;
    }
    if (!form.rate) {
      toast({ title: 'Rate required', description: 'Please enter a price per session.', variant: 'destructive' });
      return;
    }
    const data = {
      ...form,
      avatar_email: user.email,
      avatar_profile_id: profile.id,
      avatar_name: profile.display_name,
      avatar_photo_url: profile.photo_url || '',
      rate: parseFloat(form.rate) || 0,
      duration_minutes: parseInt(form.duration_minutes) || 60,
      is_active: true,
    };
    if (editingId) {
      updateOffering.mutate({ id: editingId, data });
    } else {
      createOffering.mutate(data);
    }
  };

  const handleEdit = (o) => {
    setForm({
      title: o.title, description: o.description || '',
      topic: o.topic || 'Technology', session_type: o.session_type || 'consultation',
      duration_minutes: o.duration_minutes || 60, rate: o.rate || '',
      office_hours: (o.office_hours && o.office_hours.length > 0) ? o.office_hours : DEFAULT_OFFICE_HOURS,
    });
    setEditingId(o.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(BLANK);
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Expert Offerings</h3>
          <span className="text-xs text-muted-foreground">({offerings.length})</span>
        </div>
        {!showForm && (
          <Button type="button" size="sm" className="gap-1.5 h-8" onClick={() => { setShowForm(true); setEditingId(null); setForm(BLANK); }}>
            <Plus className="w-3.5 h-3.5" /> Add Offering
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-card/40 border border-white/10 rounded-xl p-4 mb-4 space-y-3">
          <h4 className="text-sm font-semibold">{editingId ? 'Edit Offering' : 'New Offering'}</h4>
          <Input
            placeholder="Title e.g. Python for Beginners *"
            value={form.title}
            onChange={set('title')}
            className={`bg-transparent ${!form.title ? 'border-red-500/50' : 'border-white/10'}`}
          />
          <Textarea
            placeholder="What will you cover? What's the outcome?"
            value={form.description}
            onChange={set('description')}
            rows={2}
            className="bg-transparent border-white/10 resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Topic</label>
              <select
                value={form.topic}
                onChange={set('topic')}
                className="w-full text-sm bg-card border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50"
              >
                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Session Type</label>
              <select
                value={form.session_type}
                onChange={set('session_type')}
                className="w-full text-sm bg-card border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50"
              >
                {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Duration (minutes)</label>
              <Input
                type="number"
                value={form.duration_minutes}
                onChange={set('duration_minutes')}
                className="bg-transparent border-white/10"
                placeholder="60"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Rate (USD per session) *</label>
              <Input
                type="number"
                value={form.rate}
                onChange={set('rate')}
                className={`bg-transparent ${!form.rate ? 'border-red-500/50' : 'border-white/10'}`}
                placeholder="50"
              />
            </div>
          </div>
          {/* Office Hours */}
          <div className="pt-2 border-t border-white/10">
            <OfficeHoursManager
              value={form.office_hours}
              onChange={(hours) => setForm(f => ({ ...f, office_hours: hours }))}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" size="sm" onClick={handleSubmit} disabled={createOffering.isPending || updateOffering.isPending} className="gap-1.5">
              <Check className="w-3.5 h-3.5" /> {editingId ? 'Update' : 'Save'}
            </Button>
            <Button type="button" size="sm" variant="outline" className="border-white/10" onClick={handleCancel}>
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {offerings.length === 0 && !showForm ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-3xl">🎓</p>
          <p className="text-sm text-muted-foreground">No offerings yet — add what you can teach or advise on!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offerings.map(o => (
            <div key={o.id} className="flex items-center gap-3 p-3 bg-card/40 border border-white/5 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{o.title}</p>
                <p className="text-xs text-muted-foreground">{o.topic} · {o.session_type?.replace('_', ' ')} · {o.duration_minutes}min</p>
              </div>
              <span className="text-sm font-bold text-primary flex-shrink-0">${o.rate}</span>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => handleEdit(o)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                  <Pencil className="w-3.5 h-3.5 text-blue-400" />
                </button>
                <button onClick={() => deleteOffering.mutate(o.id)} disabled={deleteOffering.isPending} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}