import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Check, Loader2, Plus, Search, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
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

const STEPS = ['What You Need', 'Your Details'];

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
  const [postcodeInput, setPostcodeInput] = useState('');
  const [postcodeLoading, setPostcodeLoading] = useState(false);
  const [postcodeError, setPostcodeError] = useState('');
  const [addressOptions, setAddressOptions] = useState([]);
  const [postcodeSearched, setPostcodeSearched] = useState(false);

  const [data, setData] = useState(() => {
    const reg = JSON.parse(localStorage.getItem('cotask_registration') || '{}');
    return {
      legal_name: '',
      date_of_birth: '',
      interests: [],
      what_looking_for: '',
      what_need_help_with: '',
      postcode: '',
      full_address: '',
      city: reg.city || '',
      country: reg.country || 'United Kingdom',
      phone: reg.phone || '',
    };
  });

  const update = (k, v) => setData(p => ({ ...p, [k]: v }));
  const toggle = (k, val) => {
    const list = data[k] || [];
    update(k, list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
  };

  const addCustomInterest = () => {
    const val = customInterest.trim();
    if (val && !data.interests.includes(val)) {
      update('interests', [...data.interests, val]);
      setCustomInterest('');
    }
  };

  const customChips = data.interests.filter(i => !CATEGORIES.includes(i));

  const lookupPostcode = async () => {
    if (!postcodeInput.trim()) return;
    setPostcodeLoading(true);
    setPostcodeError('');
    setAddressOptions([]);
    setPostcodeSearched(false);
    try {
      const res = await base44.functions.invoke('postcodeAddressLookup', { postcode: postcodeInput.trim() });
      setAddressOptions(res.data.addresses || []);
      setPostcodeSearched(true);
      if (res.data.town) update('city', res.data.town);
      update('postcode', res.data.postcode || postcodeInput.trim().toUpperCase());
      if ((res.data.addresses || []).length === 0) {
        setPostcodeError('No addresses found for this postcode. Please enter your address manually.');
      }
    } catch (err) {
      setPostcodeError(err?.response?.data?.error || 'Invalid postcode. Please try again.');
    }
    setPostcodeLoading(false);
  };

  const canComplete = !!(data.full_address && data.postcode);
  const canGoNext = !!(data.legal_name.trim() && data.date_of_birth);

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
                <div className="p-4 bg-primary/5 border border-primary/15 rounded-xl">
                  <p className="text-sm font-semibold text-primary mb-0.5">Legal Identity</p>
                  <p className="text-xs text-muted-foreground">Required for verification. Must match your government-issued ID.</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Full Legal Name <span className="text-primary">*</span></label>
                  <Input value={data.legal_name} onChange={e => update('legal_name', e.target.value)}
                    placeholder="As it appears on your ID" className="bg-muted/50 border-white/5" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Date of Birth <span className="text-primary">*</span></label>
                  <Input type="date" value={data.date_of_birth} onChange={e => update('date_of_birth', e.target.value)}
                    className="bg-muted/50 border-white/5" />
                </div>
                {(!data.legal_name.trim() || !data.date_of_birth) && (
                  <p className="text-xs text-yellow-400">Legal name and date of birth are required to continue.</p>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    What services are you looking for? We'll personalise your experience and suggest the best avatars for you.
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto">
                    {CATEGORIES.map(cat => (
                      <Chip key={cat} label={cat} active={data.interests.includes(cat)} onClick={() => toggle('interests', cat)} />
                    ))}
                    {customChips.map(c => (
                      <Chip key={c} label={c} active={true} onClick={() => toggle('interests', c)} />
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
                  <label className="text-sm font-medium mb-2 block">How soon do you typically need help?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'right_now', label: '⚡ Right Now', desc: 'I need someone immediately' },
                      { val: 'today', label: '📅 Same Day', desc: 'Within the next few hours' },
                      { val: 'this_week', label: '🗓 This Week', desc: 'Plan a few days ahead' },
                      { val: 'flexible', label: '🌀 Flexible', desc: 'No rush, I plan ahead' },
                    ].map(({ val, label, desc }) => (
                      <button key={val} type="button" onClick={() => update('what_need_help_with', val)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          data.what_need_help_with === val
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'bg-muted/30 border-white/5 hover:bg-muted/50'
                        }`}>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className={`text-xs mt-0.5 ${data.what_need_help_with === val ? 'text-primary/70' : 'text-muted-foreground'}`}>{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Your Details */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Almost done! Tell us your location so we can find the best avatars near you.</p>

                {/* Postcode lookup */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Postcode <span className="text-primary">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={postcodeInput}
                      onChange={e => { setPostcodeInput(e.target.value); setPostcodeSearched(false); update('full_address', ''); }}
                      onKeyDown={e => e.key === 'Enter' && lookupPostcode()}
                      placeholder="e.g. SW1A 1AA"
                      className="bg-muted/50 border-white/5 uppercase flex-1"
                    />
                    <Button type="button" onClick={lookupPostcode} disabled={postcodeLoading || !postcodeInput.trim()} className="bg-primary hover:bg-primary/90 shrink-0">
                      {postcodeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                  {postcodeError && <p className="text-xs text-red-400 mt-1">{postcodeError}</p>}
                </div>

                {/* Address selector */}
                {postcodeSearched && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Select your address <span className="text-primary">*</span>
                    </label>
                    {addressOptions.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto space-y-1 border border-white/10 rounded-xl p-2 bg-muted/20">
                        {addressOptions.map((addr, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => update('full_address', addr)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-start gap-2 ${
                              data.full_address === addr
                                ? 'bg-primary/15 text-primary border border-primary/30'
                                : 'hover:bg-muted/50 text-foreground'
                            }`}
                          >
                            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            {addr}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">No addresses found — enter yours manually.</p>
                        <Input
                          value={data.full_address}
                          onChange={e => update('full_address', e.target.value)}
                          placeholder="e.g. 10 Downing Street, London, SW1A 2AA"
                          className="bg-muted/50 border-white/5"
                        />
                      </div>
                    )}
                    {!data.full_address && postcodeSearched && (
                      <p className="text-xs text-yellow-400 mt-1">Please select or enter your address to continue.</p>
                    )}
                    {data.full_address && (
                      <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Address confirmed
                      </p>
                    )}
                  </div>
                )}

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
            <Button onClick={() => canGoNext && setStep(s => s + 1)} disabled={!canGoNext} className="bg-primary hover:bg-primary/90 disabled:opacity-50">
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => onComplete(data)} disabled={submitting || !canComplete} className="bg-primary hover:bg-primary/90 disabled:opacity-50">
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