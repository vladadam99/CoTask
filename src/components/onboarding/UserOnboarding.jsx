import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Check, Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  'City Guide', 'Property Walkthrough', 'Shopping Help', 'Event Attendance',
  'Queue & Errands', 'Family Support', 'Business Inspection', 'Training & Coaching',
  'Campus Help', 'Travel Assistance', 'Pets & Animals', 'Cars & Vehicles',
  'Mechanics', 'Plumbing', 'Electrical Work', 'Medical & Health',
  'Outdoors & Nature', 'Cleaning', 'Gardening', 'Pick Ups', 'Deliveries',
  'Cooking & Food', 'Dating & Social', 'Driving', 'Show Me Around',
  'Carers & Companionship', 'DIY & Repairs', 'Custom Request',
];

const STEPS = ['What You Need', 'How You Work', 'Your Details'];

const Chip = ({ label, active, onClick }) => (
  <button type="button" onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${active ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
    {label}
  </button>
);

const OptionCard = ({ label, description, selected, onClick }) => (
  <button type="button" onClick={onClick}
    className={`p-4 rounded-xl border text-left transition-all w-full ${selected ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/30 border-white/5 hover:bg-muted/50 text-foreground'}`}>
    <p className="text-sm font-semibold">{label}</p>
    {description && <p className={`text-xs mt-0.5 ${selected ? 'text-primary/70' : 'text-muted-foreground'}`}>{description}</p>}
  </button>
);

export default function UserOnboarding({ user, onComplete, submitting }) {
  const [step, setStep] = useState(0);
  const [customInterest, setCustomInterest] = useState('');

  const [data, setData] = useState(() => {
    const reg = JSON.parse(localStorage.getItem('cotask_registration') || '{}');
    return {
      interests: [],
      what_looking_for: '',
      what_need_help_with: '',
      camera_preference: 'no_preference',
      scheduling_preference: 'both',
      city: reg.city || '',
      country: reg.country || 'United Kingdom',
      phone: reg.phone || '',
      budget_min: '',
      budget_max: '',
      currency: 'GBP',
    };
  });

  const update = (k, v) => setData(p => ({ ...p, [k]: v }));
  const toggle = (k, val) => {
    const list = data[k] || [];
    update(k, list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
  };

  const addCustomInterest = () => {
    if (customInterest.trim()) {
      toggle('interests', customInterest.trim());
      setCustomInterest('');
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-1">Set up your account</h1>
        <p className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        <div className="flex gap-1.5 mt-3 justify-center">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 w-12 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-8">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

            {/* Step 0: What you need */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    What services are you looking for? We'll personalise your experience and suggest the best avatars for you.
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto">
                    {CATEGORIES.map(cat => (
                      <Chip key={cat} label={cat} active={data.interests.includes(cat)} onClick={() => toggle('interests', cat)} />
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Input value={customInterest} onChange={e => setCustomInterest(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCustomInterest()}
                      placeholder="Add something specific..." className="bg-muted/50 border-white/5 text-sm flex-1" />
                    <Button type="button" variant="outline" onClick={addCustomInterest} className="border-white/10 shrink-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    What do you need help with? <span className="text-muted-foreground font-normal">(describe your situation)</span>
                  </label>
                  <textarea value={data.what_need_help_with} onChange={e => update('what_need_help_with', e.target.value)}
                    placeholder="e.g. I need someone to check on a property I'm thinking of buying, inspect it, and give me a live walkthrough while I watch from abroad..."
                    className="w-full h-24 px-3 py-2 bg-muted/50 border border-white/5 rounded-md text-sm resize-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                </div>
              </div>
            )}

            {/* Step 1: How You Work */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-2 block">Do you want jobs done with a live camera feed?</label>
                  <div className="grid grid-cols-3 gap-2">
                    <OptionCard label="Yes, live camera" description="Watch everything happen in real time" selected={data.camera_preference === 'live'} onClick={() => update('camera_preference', 'live')} />
                    <OptionCard label="No camera needed" description="Just get the task done" selected={data.camera_preference === 'no_camera'} onClick={() => update('camera_preference', 'no_camera')} />
                    <OptionCard label="No preference" description="Either option works for me" selected={data.camera_preference === 'no_preference'} onClick={() => update('camera_preference', 'no_preference')} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">When do you typically need jobs done?</label>
                  <div className="grid grid-cols-3 gap-2">
                    <OptionCard label="Immediately" description="Find available avatars right now" selected={data.scheduling_preference === 'immediate'} onClick={() => update('scheduling_preference', 'immediate')} />
                    <OptionCard label="Plan ahead" description="Schedule jobs in advance" selected={data.scheduling_preference === 'scheduled'} onClick={() => update('scheduling_preference', 'scheduled')} />
                    <OptionCard label="Both" description="Depends on the situation" selected={data.scheduling_preference === 'both'} onClick={() => update('scheduling_preference', 'both')} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Typical budget per job <span className="text-muted-foreground font-normal">(optional — helps us show relevant avatars)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <select value={data.currency} onChange={e => update('currency', e.target.value)}
                      className="h-9 px-2 rounded-md bg-muted/50 border border-white/5 text-sm text-foreground w-20">
                      {['GBP', 'USD', 'EUR', 'CAD', 'AUD'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <Input type="number" value={data.budget_min} onChange={e => update('budget_min', e.target.value)}
                      placeholder="Min" className="bg-muted/50 border-white/5 flex-1" />
                    <span className="text-muted-foreground text-sm">–</span>
                    <Input type="number" value={data.budget_max} onChange={e => update('budget_max', e.target.value)}
                      placeholder="Max" className="bg-muted/50 border-white/5 flex-1" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Your Details */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Almost done! Just a few location details so we can find avatars near you.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Your City</label>
                    <Input value={data.city} onChange={e => update('city', e.target.value)}
                      placeholder="London" className="bg-muted/50 border-white/5" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Country</label>
                    <Input value={data.country} onChange={e => update('country', e.target.value)}
                      placeholder="United Kingdom" className="bg-muted/50 border-white/5" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Anything else you're looking for? <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <textarea value={data.what_looking_for} onChange={e => update('what_looking_for', e.target.value)}
                    placeholder="e.g. I prefer avatars who speak French, have experience with property inspections, and are based in Paris..."
                    className="w-full h-24 px-3 py-2 bg-muted/50 border border-white/5 rounded-md text-sm resize-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                </div>
                <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-xl text-sm">
                  <p className="font-medium text-blue-400 mb-1">🎯 What happens next</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    You'll be taken to your dashboard where you can browse avatars, post jobs, and book sessions. Your preferences are saved and can be updated anytime.
                  </p>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={() => step > 0 ? setStep(s => s - 1) : window.history.back()}
            className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} className="bg-primary hover:bg-primary/90">
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => onComplete(data)} disabled={submitting} className="bg-primary hover:bg-primary/90">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Start Exploring
            </Button>
          )}
        </div>

        {step === 0 && (
          <p className="text-center mt-4 text-xs text-muted-foreground">
            <button onClick={() => onComplete({ interests: [], city: '', country: '' })} className="text-primary/70 hover:text-primary hover:underline">
              Skip for now and browse freely →
            </button>
          </p>
        )}
      </div>
    </div>
  );
}