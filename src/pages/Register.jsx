import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, MapPin, Search, Check, Mail, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const COUNTRIES = [
  'United Kingdom', 'United States', 'Canada', 'Australia', 'Ireland',
  'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Belgium',
  'Sweden', 'Norway', 'Denmark', 'Portugal', 'Poland', 'UAE',
  'South Africa', 'Nigeria', 'Kenya', 'India', 'Singapore', 'Other',
];

const STEPS = ['Personal Details', 'Your Address', 'Verify Email', 'All Set!'];

export default function Register() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    address_line1: '', address_line2: '', city: '', county: '',
    postcode: '', country: 'United Kingdom',
  });

  const [postcodeInput, setPostcodeInput] = useState('');
  const [postcodeLoading, setPostcodeLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [postcodeValidated, setPostcodeValidated] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [verifyCode, setVerifyCode] = useState(['', '', '', '', '', '']);
  const codeRefs = useRef([]);

  const update = (k, v) => setFormData(p => ({ ...p, [k]: v }));

  const findAddress = async () => {
    const pc = postcodeInput.replace(/\s/g, '').toUpperCase();
    if (!pc) return;
    setPostcodeLoading(true);
    setError('');
    setAddressSuggestions([]);
    setShowSuggestions(false);
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${pc}`);
      const data = await res.json();
      if (data.status === 200) {
        const city = data.result.admin_district || data.result.parliamentary_constituency || '';
        const county = data.result.admin_county || data.result.region || '';
        update('postcode', postcodeInput.toUpperCase().trim());
        update('city', city);
        update('county', county);
        update('country', 'United Kingdom');
        setPostcodeValidated(true);
        const { latitude, longitude } = data.result;
        const streets = [];
        const seen = new Set();

        // Query Nominatim with the postcode string — most reliable free method
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(postcodeInput.trim())}&countrycodes=gb&format=json&addressdetails=1&limit=50`,
          { headers: { 'User-Agent': 'CoTask-App/1.0', 'Accept-Language': 'en' } }
        );
        const nomData = await nomRes.json();
        nomData.forEach(item => {
          const road = item.address?.road || item.address?.pedestrian || item.address?.path || '';
          const suburb = item.address?.suburb || item.address?.neighbourhood || '';
          const town = item.address?.town || item.address?.city || item.address?.village || city;
          if (road && !seen.has(road)) {
            seen.add(road);
            streets.push({ road, suburb, town, display: road });
          }
        });

        // Fallback: reverse geocode the postcode center if Nominatim search gave nothing
        if (streets.length === 0) {
          const revRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=17`,
            { headers: { 'User-Agent': 'CoTask-App/1.0', 'Accept-Language': 'en' } }
          );
          const revData = await revRes.json();
          if (revData.address?.road) {
            const road = revData.address.road;
            const suburb = revData.address.suburb || revData.address.neighbourhood || '';
            const town = revData.address.town || revData.address.city || revData.address.village || city;
            streets.push({ road, suburb, town, display: road });
          }
        }

        if (streets.length > 0) {
          setAddressSuggestions(streets);
          setShowSuggestions(true);
          setShowManual(false);
        } else {
          // postcode validated but no streets found — show manual with city pre-filled
          setShowManual(true);
        }
      } else {
        setError('Postcode not found. Please enter your address manually below.');
        setShowManual(true);
        update('postcode', postcodeInput.trim());
      }
    } catch {
      setError('Could not look up postcode. Please enter your address manually.');
      setShowManual(true);
      update('postcode', postcodeInput.trim());
    } finally {
      setPostcodeLoading(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    update('address_line1', suggestion.road);
    update('address_line2', suggestion.suburb || '');
    update('city', suggestion.town || formData.city);
    update('country', 'United Kingdom');
    setShowSuggestions(false);
    setShowManual(true);
  };

  const handleCodeInput = (i, val) => {
    const cleaned = val.replace(/\D/g, '').slice(-1);
    const newCode = [...verifyCode];
    newCode[i] = cleaned;
    setVerifyCode(newCode);
    if (cleaned && i < 5) codeRefs.current[i + 1]?.focus();
  };

  const handleCodeKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !verifyCode[i] && i > 0) {
      codeRefs.current[i - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setVerifyCode(pasted.split(''));
      codeRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const sendVerificationCode = async () => {
    try {
      await base44.functions.invoke('sendVerificationEmail', { email: formData.email });
      return true;
    } catch {
      setError('Failed to send verification code. Please try again.');
      return false;
    }
  };

  const nextStep = async () => {
    setError('');
    if (step === 0) {
      if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || !formData.phone.trim()) {
        setError('Please fill in all required fields.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address.');
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!formData.address_line1.trim() || !formData.city.trim() || !formData.postcode.trim()) {
        setError('Please complete your address details before continuing.');
        return;
      }
      setSubmitting(true);
      const ok = await sendVerificationCode();
      setSubmitting(false);
      if (ok) setStep(2);
    }
  };

  const verifyAndContinue = async () => {
    const code = verifyCode.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await base44.functions.invoke('verifyEmailCode', { email: formData.email, code });
      localStorage.setItem('cotask_registration', JSON.stringify({
        ...formData,
        full_name: `${formData.first_name} ${formData.last_name}`,
      }));
      setStep(3);
    } catch (e) {
      setError(e?.response?.data?.error || 'Invalid or expired code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold tracking-tight inline-block mb-5">
            Co<span className="text-primary">Task</span>
          </Link>
          {step < 3 && (
            <>
              <h1 className="text-2xl font-bold mb-1">Create your account</h1>
              <p className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length - 1} — {STEPS[step]}</p>
              <div className="flex gap-1.5 mt-3 justify-center">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`h-1 w-12 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
                ))}
              </div>
            </>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

            {/* Step 0: Personal Details */}
            {step === 0 && (
              <div className="glass rounded-2xl p-8 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">First Name *</label>
                    <Input value={formData.first_name} onChange={e => update('first_name', e.target.value)}
                      placeholder="John" className="bg-muted/50 border-white/5" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Last Name *</label>
                    <Input value={formData.last_name} onChange={e => update('last_name', e.target.value)}
                      placeholder="Smith" className="bg-muted/50 border-white/5" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email Address *</label>
                  <Input type="email" value={formData.email} onChange={e => update('email', e.target.value)}
                    placeholder="john@example.com" className="bg-muted/50 border-white/5" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Phone Number *</label>
                  <Input type="tel" value={formData.phone} onChange={e => update('phone', e.target.value)}
                    placeholder="+44 7700 000000" className="bg-muted/50 border-white/5" />
                </div>
                {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
                <Button onClick={nextStep} className="w-full bg-primary hover:bg-primary/90 h-11">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button onClick={() => base44.auth.redirectToLogin('/RoleSelectExisting')} className="text-primary hover:underline">
                    Sign in
                  </button>
                </p>
              </div>
            )}

            {/* Step 1: Address */}
            {step === 1 && (
              <div className="glass rounded-2xl p-8 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Postcode / Zip Code</label>
                  <div className="flex gap-2">
                    <Input
                      value={postcodeInput}
                      onChange={e => setPostcodeInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && findAddress()}
                      placeholder="e.g. SW1A 1AA"
                      className="bg-muted/50 border-white/5 flex-1"
                    />
                    <Button onClick={findAddress} disabled={postcodeLoading || !postcodeInput.trim()}
                      variant="outline" className="border-white/10 shrink-0 px-3">
                      {postcodeLoading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><Search className="w-4 h-4 mr-1" />Find</>}
                    </Button>
                  </div>
                  {postcodeValidated && !showSuggestions && (
                    <p className="text-xs text-green-400 mt-1.5 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Postcode validated — complete your address below
                    </p>
                  )}

                  {/* Address suggestions dropdown */}
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="mt-2 rounded-xl border border-white/10 overflow-hidden bg-card shadow-xl">
                      <p className="text-xs text-muted-foreground px-3 py-2 border-b border-white/5">Select your street — you can add your house number after</p>
                      <div className="max-h-52 overflow-y-auto">
                        {addressSuggestions.map((s, i) => (
                          <button key={i} onClick={() => selectSuggestion(s)}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-colors border-b border-white/5 last:border-0 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>{s.display}</span>
                          </button>
                        ))}
                      </div>
                      <button onClick={() => { setShowSuggestions(false); setShowManual(true); }}
                        className="w-full text-xs text-primary px-3 py-2 hover:bg-primary/5 text-left transition-colors border-t border-white/5">
                        + Enter address manually instead
                      </button>
                    </div>
                  )}
                </div>

                {!showManual && !showSuggestions && (
                  <button onClick={() => { setShowManual(true); }} className="text-sm text-primary hover:underline flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> I don't see my address, add manually
                  </button>
                )}

                {showManual && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Address Line 1 * <span className="text-xs text-muted-foreground font-normal">(add your house/flat number)</span></label>
                      <Input value={formData.address_line1} onChange={e => update('address_line1', e.target.value)}
                        placeholder="e.g. 12 Main Street" className="bg-muted/50 border-white/5" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        Address Line 2 <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <Input value={formData.address_line2} onChange={e => update('address_line2', e.target.value)}
                        placeholder="Flat, apartment, suite, etc." className="bg-muted/50 border-white/5" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">City / Town *</label>
                        <Input value={formData.city} onChange={e => update('city', e.target.value)}
                          placeholder="London" className="bg-muted/50 border-white/5" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Postcode *</label>
                        <Input value={formData.postcode} onChange={e => update('postcode', e.target.value)}
                          placeholder="SW1A 1AA" className="bg-muted/50 border-white/5" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Country *</label>
                      <select value={formData.country} onChange={e => update('country', e.target.value)}
                        className="w-full h-9 px-3 rounded-md bg-muted/50 border border-white/5 text-sm text-foreground">
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

                <div className="flex gap-3 pt-1">
                  <Button variant="ghost" onClick={() => { setStep(0); setError(''); }} className="flex-1 text-muted-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button onClick={nextStep} disabled={submitting} className="flex-1 bg-primary hover:bg-primary/90">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Verify Email */}
            {step === 2 && (
              <div className="glass rounded-2xl p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We've sent a 6-digit verification code to<br />
                    <span className="text-foreground font-semibold">{formData.email}</span>
                  </p>
                </div>

                <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
                  {verifyCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => codeRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleCodeInput(i, e.target.value)}
                      onKeyDown={e => handleCodeKeyDown(i, e)}
                      className="w-11 h-14 text-center text-xl font-bold bg-muted/50 border border-white/10 rounded-xl focus:outline-none focus:border-primary transition-colors text-foreground"
                    />
                  ))}
                </div>

                {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

                <Button
                  onClick={verifyAndContinue}
                  disabled={submitting || verifyCode.join('').length !== 6}
                  className="w-full bg-primary hover:bg-primary/90 h-11"
                >
                  {submitting
                    ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    : <Check className="w-4 h-4 mr-2" />}
                  Verify Email
                </Button>

                <div className="flex items-center justify-center gap-5 text-sm">
                  <button onClick={() => { setStep(0); setVerifyCode(['', '', '', '', '', '']); setError(''); }}
                    className="text-muted-foreground hover:text-foreground transition-colors">
                    ← Change email
                  </button>
                  <button
                    onClick={async () => {
                      setError('');
                      setSubmitting(true);
                      await sendVerificationCode();
                      setSubmitting(false);
                    }}
                    disabled={submitting}
                    className="text-primary hover:underline"
                  >
                    Resend code
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <div className="glass rounded-2xl p-10 text-center space-y-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                  <div className="w-24 h-24 bg-green-500/15 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                    <Check className="w-12 h-12 text-green-400" />
                  </div>
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Email verified! 🎉</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Your email has been confirmed. Now let's create your account and set up your profile on CoTask.
                  </p>
                </div>
                <Button
                  onClick={() => base44.auth.redirectToLogin('/RoleSelect')}
                  className="w-full bg-primary hover:bg-primary/90 h-12 text-base font-semibold"
                >
                  Continue Setting Up <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  You'll be asked to create a password and choose your role on the next step.
                </p>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}