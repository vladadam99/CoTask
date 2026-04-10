import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ArrowLeft, Check, Loader2, Plus, X, Search, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Arabic',
  'Chinese (Mandarin)', 'Japanese', 'Korean', 'Russian', 'Dutch', 'Polish',
  'Turkish', 'Hindi', 'Bengali', 'Urdu', 'Swahili', 'Romanian', 'Greek',
  'Swedish', 'Norwegian', 'Danish', 'Vietnamese', 'Thai', 'Indonesian',
];

const CATEGORIES = [
  'City Guide', 'Property Walkthrough', 'Shopping Help', 'Event Attendance',
  'Queue & Errands', 'Family Support', 'Business Inspection', 'Training & Coaching',
  'Campus Help', 'Travel Assistance', 'Pets & Animals', 'Cars & Vehicles',
  'Mechanics', 'Plumbing', 'Electrical Work', 'Medical & Health',
  'Outdoors & Nature', 'Cleaning', 'Gardening', 'Pick Ups', 'Deliveries',
  'Cooking & Food', 'Dating & Social', 'Driving', 'Show Me Around',
  'Carers & Companionship', 'DIY & Repairs', 'Custom Request',
];

const SKILLS = [
  'Navigation', 'Photography', 'Videography', 'First Aid', 'Driving',
  'Translation', 'Customer Service', 'Sales', 'Negotiation', 'Property Assessment',
  'Technical Inspection', 'Event Management', 'Care & Support', 'Cooking',
  'Cleaning', 'Mechanical', 'Electrical', 'Plumbing', 'DIY & Repairs',
  'Animal Care', 'Personal Shopping', 'Security', 'Medical Knowledge',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = [
  '06:00','07:00','08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00','18:00','19:00',
  '20:00','21:00','22:00','23:00',
];
const CURRENCIES = ['GBP', 'USD', 'EUR', 'CAD', 'AUD', 'AED', 'JPY', 'INR'];

const STEPS = ['Your Profile', 'Location & Travel', 'Services & Skills', 'Availability & Equipment', 'Pricing'];

const Chip = ({ label, active, onClick }) => (
  <button type="button" onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${active ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
    {label}
  </button>
);

const Toggle = ({ label, description, value, onChange }) => (
  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
    <div>
      <p className="text-sm font-medium">{label}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    <button type="button" onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-primary' : 'bg-muted'}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
    </button>
  </div>
);

export default function AvatarOnboarding({ user, onComplete, submitting }) {
  const [step, setStep] = useState(0);
  const [customSkill, setCustomSkill] = useState('');
  const [extraCityInput, setExtraCityInput] = useState('');
  const [postcodeInput, setPostcodeInput] = useState('');
  const [postcodeLoading, setPostcodeLoading] = useState(false);
  const [postcodeError, setPostcodeError] = useState('');
  const [addressOptions, setAddressOptions] = useState([]);
  const [postcodeSearched, setPostcodeSearched] = useState(false);

  const [data, setData] = useState(() => {
    const reg = JSON.parse(localStorage.getItem('cotask_registration') || '{}');
    return {
      display_name: user?.full_name || reg.full_name || '',
      legal_name: '',
      date_of_birth: '',
      bio: '',
      languages: ['English'],
      postcode: '',
      full_address: '',
      city: reg.city || '',
      country: reg.country || 'United Kingdom',
      willing_to_travel: false,
      travel_radius_km: '50',
      extra_cities: [],
      categories: [],
      skills: [],
      willing_to_do: '',
      has_vehicle: false,
      has_360_camera: false,
      has_headset: false,
      has_smartphone: true,
      has_data_connection: true,
      is_enterprise_ready: false,
      does_live_jobs: true,
      booking_type: 'both',
      available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      available_from: '09:00',
      available_to: '18:00',
      hourly_rate: '',
      per_session_rate: '',
      currency: 'GBP',
      negotiable: true,
      live_premium: '',
    };
  });

  const update = (k, v) => setData(p => ({ ...p, [k]: v }));
  const toggle = (k, val) => {
    const list = data[k] || [];
    update(k, list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
  };

  const addCustomSkill = () => {
    if (customSkill.trim()) {
      toggle('skills', customSkill.trim());
      setCustomSkill('');
    }
  };

  const addExtraCity = () => {
    if (extraCityInput.trim()) {
      toggle('extra_cities', extraCityInput.trim());
      setExtraCityInput('');
    }
  };

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
        setPostcodeError('No addresses found for this postcode. Please select your address manually.');
      }
    } catch (err) {
      setPostcodeError(err?.response?.data?.error || 'Invalid postcode. Please try again.');
    }
    setPostcodeLoading(false);
  };

  const canGoNextStep = () => {
    if (step === 0) return !!(data.legal_name.trim() && data.date_of_birth);
    if (step === 1) return !!(data.full_address && data.postcode);
    if (step === 2) return data.categories.length > 0;
    return true;
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-1">Set up your Avatar profile</h1>
        <p className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        <div className="flex gap-1.5 mt-3 justify-center">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 w-8 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-8">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

            {/* Step 0: Profile */}
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">This is what clients see when they find you. Make it count!</p>

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
                  <label className="text-sm font-medium mb-1.5 block">Display Name</label>
                  <Input value={data.display_name} onChange={e => update('display_name', e.target.value)}
                    placeholder="Your name or nickname" className="bg-muted/50 border-white/5" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Bio</label>
                  <Textarea value={data.bio} onChange={e => update('bio', e.target.value)}
                    placeholder="Tell clients about yourself — your personality, experience, what makes you a great avatar, and what kind of jobs you enjoy..."
                    className="bg-muted/50 border-white/5 h-28 resize-none" />
                  <p className="text-xs text-muted-foreground mt-1">{data.bio.length}/500 characters</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Languages you speak</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {LANGUAGES.map(lang => (
                      <Chip key={lang} label={lang} active={data.languages.includes(lang)} onClick={() => toggle('languages', lang)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Location & Travel */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Help clients find you and know how far you can go.</p>

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

                {!postcodeSearched && data.full_address && (
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> {data.full_address}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">City / Town</label>
                    <Input value={data.city} onChange={e => update('city', e.target.value)}
                      placeholder="London" className="bg-muted/50 border-white/5" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Country</label>
                    <Input value={data.country} onChange={e => update('country', e.target.value)}
                      placeholder="United Kingdom" className="bg-muted/50 border-white/5" />
                  </div>
                </div>
                <Toggle
                  label="Willing to travel"
                  description="Accept jobs requiring travel to a different location"
                  value={data.willing_to_travel}
                  onChange={v => update('willing_to_travel', v)}
                />
                {data.willing_to_travel && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Maximum travel distance</label>
                    <select value={data.travel_radius_km} onChange={e => update('travel_radius_km', e.target.value)}
                      className="w-full h-9 px-3 rounded-md bg-muted/50 border border-white/5 text-sm text-foreground">
                      {['10', '25', '50', '100', '200', 'Anywhere'].map(v => (
                        <option key={v} value={v}>{v === 'Anywhere' ? 'Anywhere' : `Up to ${v}km`}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Other cities you can serve <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <div className="flex gap-2">
                    <Input value={extraCityInput} onChange={e => setExtraCityInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addExtraCity()}
                      placeholder="Add a city..." className="bg-muted/50 border-white/5 flex-1 text-sm" />
                    <Button type="button" variant="outline" onClick={addExtraCity} className="border-white/10 shrink-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {data.extra_cities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {data.extra_cities.map(city => (
                        <span key={city} className="flex items-center gap-1 px-3 py-1 bg-muted/50 rounded-lg text-sm">
                          {city}
                          <button onClick={() => toggle('extra_cities', city)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Services & Skills */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Services you offer <span className="text-muted-foreground font-normal">(select all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
                    {CATEGORIES.map(cat => (
                      <Chip key={cat} label={cat} active={data.categories.includes(cat)} onClick={() => toggle('categories', cat)} />
                    ))}
                  </div>
                  {data.categories.length === 0 && (
                    <p className="text-xs text-yellow-400 mt-2">Select at least one service to continue.</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Your skills & expertise</label>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto mb-3">
                    {SKILLS.map(skill => (
                      <Chip key={skill} label={skill} active={data.skills.includes(skill)} onClick={() => toggle('skills', skill)} />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={customSkill} onChange={e => setCustomSkill(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCustomSkill()}
                      placeholder="Add a custom skill..." className="bg-muted/50 border-white/5 text-sm flex-1" />
                    <Button type="button" variant="outline" onClick={addCustomSkill} className="border-white/10 shrink-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {data.skills.filter(s => !SKILLS.includes(s)).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {data.skills.filter(s => !SKILLS.includes(s)).map(s => (
                        <span key={s} className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm">
                          {s} <button onClick={() => toggle('skills', s)}><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">What are you willing to do? <span className="text-muted-foreground font-normal">(in your own words)</span></label>
                  <Textarea value={data.willing_to_do} onChange={e => update('willing_to_do', e.target.value)}
                    placeholder="e.g. I'm happy to stand in queues, visit properties, run errands, attend events, do live tours, inspect vehicles, help with shopping, etc."
                    className="bg-muted/50 border-white/5 h-20 resize-none text-sm" />
                </div>
              </div>
            )}

            {/* Step 3: Availability & Equipment */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-2 block">Job type preference</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{v:'scheduled',l:'Scheduled Only',d:'Plan ahead jobs'},{v:'instant',l:'Instant Only',d:'On-demand jobs'},{v:'both',l:'Both',d:'Open to all'}].map(({v,l,d}) => (
                      <button key={v} type="button" onClick={() => update('booking_type', v)}
                        className={`p-3 rounded-xl border text-left transition-all ${data.booking_type === v ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/30 border-white/5 text-muted-foreground hover:bg-muted/50'}`}>
                        <p className="text-sm font-semibold">{l}</p>
                        <p className="text-xs mt-0.5 opacity-70">{d}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Days available</label>
                  <div className="flex gap-2">
                    {DAYS.map(day => (
                      <button key={day} type="button" onClick={() => toggle('available_days', day)}
                        className={`flex-1 h-9 rounded-lg text-xs font-medium transition-all ${data.available_days.includes(day) ? 'bg-primary text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Available from</label>
                    <select value={data.available_from} onChange={e => update('available_from', e.target.value)}
                      className="w-full h-9 px-3 rounded-md bg-muted/50 border border-white/5 text-sm text-foreground">
                      {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Available until</label>
                    <select value={data.available_to} onChange={e => update('available_to', e.target.value)}
                      className="w-full h-9 px-3 rounded-md bg-muted/50 border border-white/5 text-sm text-foreground">
                      {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Equipment & capabilities</label>
                  <div className="space-y-2">
                    <Toggle label="Smartphone" description="Can receive calls and stream video" value={data.has_smartphone} onChange={v => update('has_smartphone', v)} />
                    <Toggle label="Reliable Mobile Data" description="4G/5G connection for live streaming" value={data.has_data_connection} onChange={v => update('has_data_connection', v)} />
                    <Toggle label="Vehicle" description="Car, motorbike or other transport" value={data.has_vehicle} onChange={v => update('has_vehicle', v)} />
                    <Toggle label="360° Camera" description="Offer immersive view experiences" value={data.has_360_camera} onChange={v => update('has_360_camera', v)} />
                    <Toggle label="Headset / Earpiece" description="Hands-free comms during jobs" value={data.has_headset} onChange={v => update('has_headset', v)} />
                    <Toggle label="Available for Live Jobs" description="Willing to stream live via camera" value={data.does_live_jobs} onChange={v => update('does_live_jobs', v)} />
                    <Toggle label="Enterprise Ready" description="Can handle large-scale business deployments" value={data.is_enterprise_ready} onChange={v => update('is_enterprise_ready', v)} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Pricing */}
            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Set your rates — you can update these anytime from your profile.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Currency</label>
                    <select value={data.currency} onChange={e => update('currency', e.target.value)}
                      className="w-full h-9 px-3 rounded-md bg-muted/50 border border-white/5 text-sm text-foreground">
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Hourly Rate</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{data.currency}</span>
                      <Input type="number" value={data.hourly_rate} onChange={e => update('hourly_rate', e.target.value)}
                        placeholder="25" className="bg-muted/50 border-white/5 pl-12" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Per-Session Rate <span className="text-muted-foreground font-normal">(optional — fixed rate regardless of time)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{data.currency}</span>
                    <Input type="number" value={data.per_session_rate} onChange={e => update('per_session_rate', e.target.value)}
                      placeholder="Leave blank to only charge hourly" className="bg-muted/50 border-white/5 pl-12" />
                  </div>
                </div>
                {data.does_live_jobs && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Live Camera Premium <span className="text-muted-foreground font-normal">(extra charge per hour for live jobs)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{data.currency}</span>
                      <Input type="number" value={data.live_premium} onChange={e => update('live_premium', e.target.value)}
                        placeholder="0" className="bg-muted/50 border-white/5 pl-12" />
                    </div>
                  </div>
                )}
                <Toggle
                  label="Open to negotiation"
                  description="Allow clients to negotiate your rate on specific jobs"
                  value={data.negotiable}
                  onChange={v => update('negotiable', v)}
                />
                <div className="p-4 bg-primary/5 border border-primary/15 rounded-xl text-sm">
                  <p className="font-medium text-primary mb-1">💡 Pricing tip</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Avatars on CoTask typically charge £15–£60/hr depending on the service type. Starting competitively helps you build your first reviews faster.
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
            <Button onClick={() => canGoNextStep() && setStep(s => s + 1)} disabled={!canGoNextStep()} className="bg-primary hover:bg-primary/90 disabled:opacity-50">
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => onComplete(data)} disabled={submitting} className="bg-primary hover:bg-primary/90">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}