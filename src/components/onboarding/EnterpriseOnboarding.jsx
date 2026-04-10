import React, { useState } from 'react';
import IdentityVerification from '@/components/verification/IdentityVerification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Check, Loader2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INDUSTRIES = [
  'Real Estate', 'Construction', 'Retail', 'Technology', 'Healthcare',
  'Education', 'Logistics & Supply Chain', 'Manufacturing', 'Media & Events',
  'Insurance', 'Legal', 'Financial Services', 'Hospitality & Tourism',
  'Energy & Utilities', 'Government', 'Other',
];

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–1000', '1000+'];

const CATEGORIES = [
  'Property Walkthrough', 'Business Inspection', 'Training & Coaching',
  'Cars & Vehicles', 'Medical & Health', 'Queue & Errands',
  'Event Attendance', 'Pick Ups', 'Deliveries', 'Show Me Around',
  'Cleaning', 'Electrical Work', 'Plumbing', 'Mechanics',
  'Campus Help', 'Security', 'DIY & Repairs', 'Custom Request',
];

const STEPS = ['Company Info', 'Contact & Locations', 'Operations & Services', 'Identity Verification'];

const Chip = ({ label, active, onClick }) => (
  <button type="button" onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${active ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
    {label}
  </button>
);

export default function EnterpriseOnboarding({ user, onComplete, submitting }) {
  const [step, setStep] = useState(0);
  const [idVerified, setIdVerified] = useState(false);
  const [cityInput, setCityInput] = useState('');

  const [data, setData] = useState(() => {
    const reg = JSON.parse(localStorage.getItem('cotask_registration') || '{}');
    return {
      company_name: '',
      industry: '',
      company_size: '',
      contact_person: user?.full_name || reg.full_name || '',
      phone: reg.phone || '',
      company_email: user?.email || reg.email || '',
      cities: [],
      booking_needs: '',
      typical_team_size: '1–5',
      invoice_preference: 'monthly',
      categories: [],
      notes: '',
    };
  });

  const update = (k, v) => setData(p => ({ ...p, [k]: v }));
  const toggle = (k, val) => {
    const list = data[k] || [];
    update(k, list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
  };

  const addCity = () => {
    if (cityInput.trim()) {
      toggle('cities', cityInput.trim());
      setCityInput('');
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-1">Set up your business account</h1>
        <p className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        <div className="flex gap-1.5 mt-3 justify-center">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 w-14 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-8">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

            {/* Step 0: Company Info */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Company Name *</label>
                  <Input value={data.company_name} onChange={e => update('company_name', e.target.value)}
                    placeholder="Acme Corporation" className="bg-muted/50 border-white/5" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Industry *</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {INDUSTRIES.map(ind => (
                      <Chip key={ind} label={ind} active={data.industry === ind} onClick={() => update('industry', ind)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Company size</label>
                  <div className="flex gap-2 flex-wrap">
                    {COMPANY_SIZES.map(size => (
                      <button key={size} type="button" onClick={() => update('company_size', size)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all border ${data.company_size === size ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-muted/30 border-white/5 text-muted-foreground hover:bg-muted/50'}`}>
                        {size} employees
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Contact & Locations */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Contact Person *</label>
                    <Input value={data.contact_person} onChange={e => update('contact_person', e.target.value)}
                      placeholder="Your full name" className="bg-muted/50 border-white/5" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Phone Number *</label>
                    <Input type="tel" value={data.phone} onChange={e => update('phone', e.target.value)}
                      placeholder="+44 20 0000 0000" className="bg-muted/50 border-white/5" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Business Email</label>
                  <Input type="email" value={data.company_email} onChange={e => update('company_email', e.target.value)}
                    placeholder="ops@company.com" className="bg-muted/50 border-white/5" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Cities where you operate</label>
                  <div className="flex gap-2 mb-2">
                    <Input value={cityInput} onChange={e => setCityInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCity()}
                      placeholder="Add a city..." className="bg-muted/50 border-white/5 flex-1 text-sm" />
                    <Button type="button" variant="outline" onClick={addCity} className="border-white/10 shrink-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {data.cities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {data.cities.map(city => (
                        <span key={city} className="flex items-center gap-1 px-3 py-1.5 bg-muted/50 rounded-lg text-sm">
                          {city}
                          <button onClick={() => toggle('cities', city)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Typical number of avatars needed per deployment</label>
                  <div className="flex gap-2 flex-wrap">
                    {['1', '2–5', '5–10', '10–20', '20+'].map(n => (
                      <button key={n} type="button" onClick={() => update('typical_team_size', n)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all border ${data.typical_team_size === n ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-muted/30 border-white/5 text-muted-foreground hover:bg-muted/50'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Operations & Services */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">What will you be using CoTask for?</label>
                  <textarea value={data.booking_needs} onChange={e => update('booking_needs', e.target.value)}
                    placeholder="e.g. We need avatars to conduct property inspections across multiple cities, attend trade shows on our behalf, manage on-site deliveries, and provide live updates to our operations team..."
                    className="w-full h-24 px-3 py-2 bg-muted/50 border border-white/5 rounded-md text-sm resize-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Services you'll need <span className="text-muted-foreground font-normal">(select all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {CATEGORIES.map(cat => (
                      <Chip key={cat} label={cat} active={data.categories.includes(cat)} onClick={() => toggle('categories', cat)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Invoice preference</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{v:'per_booking',l:'Per Booking',d:'Invoiced each job'},{v:'monthly',l:'Monthly',d:'One invoice/month'},{v:'quarterly',l:'Quarterly',d:'Every 3 months'}].map(({v,l,d}) => (
                      <button key={v} type="button" onClick={() => update('invoice_preference', v)}
                        className={`p-3 rounded-xl border text-left transition-all ${data.invoice_preference === v ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/30 border-white/5 text-muted-foreground hover:bg-muted/50'}`}>
                        <p className="text-sm font-semibold">{l}</p>
                        <p className="text-xs mt-0.5 opacity-70">{d}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-purple-500/5 border border-purple-500/15 rounded-xl text-sm">
                  <p className="font-medium text-purple-400 mb-1">🏢 Enterprise benefits</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Enterprise accounts get priority support, bulk booking discounts, dedicated account management, and custom SLA options. Our team will reach out after setup.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Identity Verification */}
            {step === 3 && (
              <IdentityVerification
                profileId={null}
                profileType="enterprise"
                onComplete={() => setIdVerified(true)}
              />
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
            <Button onClick={() => onComplete(data)} disabled={submitting || !idVerified} className="bg-primary hover:bg-primary/90 disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}