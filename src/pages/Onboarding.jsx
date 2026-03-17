import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';

const CATEGORIES = [
  'City Guide', 'Property Walkthrough', 'Shopping Help', 'Event Attendance',
  'Queue & Errands', 'Family Support', 'Business Inspection', 'Training & Coaching',
  'Campus Help', 'Travel Assistance', 'Custom Request'
];

export default function Onboarding() {
  const { user, loading, updateUser } = useCurrentUser();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('user');
  const [formData, setFormData] = useState({
    city: '', country: '', interests: [], preferred_language: 'English',
    display_name: '', bio: '', categories: [], hourly_rate: '', languages: [],
    company_name: '', contact_person: '', company_email: '', phone: '', industry: '',
  });

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem('cotask_role');
      const r = user.app_role || stored || 'user';
      setRole(r);
      setFormData(prev => ({ ...prev, display_name: user.full_name || '' }));
    }
  }, [user]);

  const update = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
  const toggleInterest = (cat) => {
    const key = role === 'user' ? 'interests' : 'categories';
    const list = formData[key] || [];
    update(key, list.includes(cat) ? list.filter(c => c !== cat) : [...list, cat]);
  };

  const finish = async () => {
    await updateUser({
      app_role: role,
      onboarding_complete: true,
      city: formData.city,
      country: formData.country,
      interests: formData.interests,
      preferred_language: formData.preferred_language,
    });

    if (role === 'avatar') {
      await base44.entities.AvatarProfile.create({
        user_email: user.email,
        display_name: formData.display_name || user.full_name,
        bio: formData.bio,
        city: formData.city,
        country: formData.country,
        categories: formData.categories,
        languages: [formData.preferred_language],
        hourly_rate: parseFloat(formData.hourly_rate) || 30,
        is_available: true,
      });
    } else if (role === 'enterprise') {
      await base44.entities.EnterpriseProfile.create({
        user_email: user.email,
        company_name: formData.company_name,
        contact_person: formData.contact_person || user.full_name,
        company_email: formData.company_email || user.email,
        phone: formData.phone,
        industry: formData.industry,
        cities: formData.city ? [formData.city] : [],
      });
    }

    const dest = role === 'user' ? '/UserDashboard' : role === 'avatar' ? '/AvatarDashboard' : '/EnterpriseDashboard';
    window.location.href = dest;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const steps = role === 'user'
    ? ['Basics', 'Interests']
    : role === 'avatar'
    ? ['Basics', 'Services', 'Pricing']
    : ['Basics', 'Company'];

  const currentStep = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      <div className="relative z-10 max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Set up your profile</h1>
          <p className="text-sm text-muted-foreground">Step {step + 1} of {steps.length} · {currentStep}</p>
          <div className="flex gap-2 mt-4 justify-center">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 w-12 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        </div>

        <GlassCard className="p-8">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              {currentStep === 'Basics' && (
                <div className="space-y-4">
                  {role !== 'enterprise' && (
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Display Name</label>
                      <Input value={formData.display_name} onChange={e => update('display_name', e.target.value)} placeholder="Your name" className="bg-muted/50 border-white/5" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">City</label>
                      <Input value={formData.city} onChange={e => update('city', e.target.value)} placeholder="New York" className="bg-muted/50 border-white/5" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Country</label>
                      <Input value={formData.country} onChange={e => update('country', e.target.value)} placeholder="United States" className="bg-muted/50 border-white/5" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Preferred Language</label>
                    <Select value={formData.preferred_language} onValueChange={v => update('preferred_language', v)}>
                      <SelectTrigger className="bg-muted/50 border-white/5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['English', 'Spanish', 'French', 'German', 'Japanese', 'Arabic', 'Chinese', 'Portuguese'].map(l => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {role === 'avatar' && (
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Bio</label>
                      <Textarea value={formData.bio} onChange={e => update('bio', e.target.value)} placeholder="Tell clients about yourself and what you offer..." className="bg-muted/50 border-white/5 h-24" />
                    </div>
                  )}
                </div>
              )}

              {currentStep === 'Interests' && (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">Select what you're interested in</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => toggleInterest(cat)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${
                          (formData.interests || []).includes(cat) ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}>{cat}</button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 'Services' && (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">Select the services you offer</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => toggleInterest(cat)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${
                          (formData.categories || []).includes(cat) ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}>{cat}</button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 'Pricing' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Hourly Rate (USD)</label>
                    <Input type="number" value={formData.hourly_rate} onChange={e => update('hourly_rate', e.target.value)} placeholder="30" className="bg-muted/50 border-white/5" />
                  </div>
                  <p className="text-xs text-muted-foreground">You can always adjust your pricing later from your settings.</p>
                </div>
              )}

              {currentStep === 'Company' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Company Name</label>
                    <Input value={formData.company_name} onChange={e => update('company_name', e.target.value)} placeholder="Acme Corp" className="bg-muted/50 border-white/5" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Contact Person</label>
                    <Input value={formData.contact_person} onChange={e => update('contact_person', e.target.value)} placeholder="Jane Smith" className="bg-muted/50 border-white/5" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Industry</label>
                    <Select value={formData.industry} onValueChange={v => update('industry', v)}>
                      <SelectTrigger className="bg-muted/50 border-white/5"><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>
                        {['Real Estate', 'Construction', 'Retail', 'Technology', 'Healthcare', 'Education', 'Logistics', 'Manufacturing', 'Other'].map(i => (
                          <SelectItem key={i} value={i}>{i}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Phone</label>
                    <Input value={formData.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 (555) 000-0000" className="bg-muted/50 border-white/5" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            ) : <div />}
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} className="bg-primary hover:bg-primary/90">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={finish} className="bg-primary hover:bg-primary/90">
                Complete <Check className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}