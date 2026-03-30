import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Search, MapPin, Mail, Check, Loader2, RefreshCw, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

const STEPS = ['Personal Details', 'Verify Email', 'All Set'];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Personal details
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    postcode: '', addressLine1: '', addressLine2: '', city: '', country: 'United Kingdom',
  });
  const [addressResults, setAddressResults] = useState([]);
  const [addressSearched, setAddressSearched] = useState(false);
  const [manualAddress, setManualAddress] = useState(false);
  const [lookingUpAddress, setLookingUpAddress] = useState(false);

  // Verification
  const [code, setCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [resending, setResending] = useState(false);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const findAddress = async () => {
    if (!form.postcode.trim()) return;
    setLookingUpAddress(true);
    setError('');
    setAddressResults([]);
    setAddressSearched(false);
    try {
      const pc = form.postcode.replace(/\s/g, '').toUpperCase();
      const res = await fetch(`https://api.postcodes.io/postcodes/${pc}`);
      const data = await res.json();
      if (data.status === 200 && data.result) {
        const r = data.result;
        // Build some representative addresses from postcode data
        const district = r.admin_district || '';
        const ward = r.admin_ward || '';
        const parish = r.parish || '';
        const town = r.admin_district || r.admin_county || '';
        const county = r.admin_county || '';
        // Generate plausible address options
        const suggestions = [
          ward && `${ward}, ${town}`,
          parish && parish !== town && `${parish}, ${town}`,
          district && `${district}, ${county || r.country}`,
          `${r.region || r.country}`,
        ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);

        setAddressResults(suggestions.map((s, i) => ({
          label: s,
          line1: s.split(',')[0]?.trim() || '',
          city: town || '',
          country: r.country || 'United Kingdom',
        })));
        if (!form.city) update('city', town);
        if (!form.country) update('country', r.country || 'United Kingdom');
        setAddressSearched(true);
      } else {
        setError('Postcode not found. Please enter your address manually.');
        setManualAddress(true);
        setAddressSearched(true);
      }
    } catch {
      setError('Could not look up postcode. Please enter manually.');
      setManualAddress(true);
      setAddressSearched(true);
    }
    setLookingUpAddress(false);
  };

  const selectAddress = (addr) => {
    update('addressLine1', addr.line1);
    update('city', addr.city);
    update('country', addr.country);
    setManualAddress(true);
    setAddressResults([]);
  };

  const validatePersonal = () => {
    if (!form.firstName.trim()) return 'First name is required.';
    if (!form.lastName.trim()) return 'Last name is required.';
    if (!form.email.trim() || !form.email.includes('@')) return 'A valid email is required.';
    if (!form.phone.trim()) return 'Phone number is required.';
    if (!form.postcode.trim()) return 'Postcode / ZIP code is required.';
    if (!form.addressLine1.trim()) return 'Please select or enter your address.';
    if (!form.city.trim()) return 'City is required.';
    if (!form.country.trim()) return 'Country is required.';
    return '';
  };

  const sendCode = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('sendVerificationEmail', { email: form.email, name: form.firstName });
      setSentCode(res.data.code);
      setStep(1);
    } catch (e) {
      setError('Failed to send verification email. Please try again.');
    }
    setLoading(false);
  };

  const handleNext = async () => {
    setError('');
    if (step === 0) {
      const err = validatePersonal();
      if (err) { setError(err); return; }
      await sendCode();
    }
  };

  const handleVerify = () => {
    setVerifyError('');
    if (code.trim() === String(sentCode).trim()) {
      // Save registration data for use in onboarding
      localStorage.setItem('cotask_reg', JSON.stringify({
        full_name: `${form.firstName} ${form.lastName}`,
        email: form.email, phone: form.phone,
        address: form.addressLine1, address2: form.addressLine2,
        city: form.city, country: form.country, postcode: form.postcode,
      }));
      setStep(2);
    } else {
      setVerifyError('Incorrect code. Please check your email and try again.');
    }
  };

  const resendCode = async () => {
    setResending(true);
    try {
      const res = await base44.functions.invoke('sendVerificationEmail', { email: form.email, name: form.firstName });
      setSentCode(res.data.code);
      setVerifyError('');
      setCode('');
    } catch { }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-lg w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold tracking-tight inline-block mb-5">
            Co<span className="text-primary">Task</span>
          </Link>
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${i === step ? 'text-primary' : i < step ? 'text-green-400' : 'text-muted-foreground'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${i < step ? 'bg-green-500 border-green-500 text-white' : i === step ? 'border-primary text-primary' : 'border-muted-foreground/30 text-muted-foreground'}`}>
                    {i < step ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className="hidden sm:inline">{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px max-w-[40px] ${i < step ? 'bg-green-500' : 'bg-muted'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 0: Personal Details */}
          {step === 0 && (
            <motion.div key="personal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="glass rounded-2xl p-7 border border-white/5">
                <h2 className="text-xl font-bold mb-1">Create your account</h2>
                <p className="text-sm text-muted-foreground mb-6">Enter your personal details to get started.</p>

                <div className="space-y-4">
                  {/* Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">First Name *</label>
                      <Input value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="John" className="bg-muted/50 border-white/8" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Last Name *</label>
                      <Input value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Smith" className="bg-muted/50 border-white/8" />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@example.com" type="email" className="bg-muted/50 border-white/8 pl-10" />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+44 7700 900000" className="bg-muted/50 border-white/8 pl-10" />
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Country *</label>
                    <Input value={form.country} onChange={e => update('country', e.target.value)} placeholder="United Kingdom" className="bg-muted/50 border-white/8" />
                  </div>

                  {/* Postcode finder */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Postcode / ZIP Code *</label>
                    <div className="flex gap-2">
                      <Input
                        value={form.postcode}
                        onChange={e => { update('postcode', e.target.value); setAddressSearched(false); setAddressResults([]); setManualAddress(false); }}
                        placeholder="e.g. SW1A 1AA"
                        className="bg-muted/50 border-white/8 uppercase"
                      />
                      <Button onClick={findAddress} disabled={lookingUpAddress || !form.postcode.trim()} variant="outline" className="shrink-0 border-white/10">
                        {lookingUpAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 mr-1" /> Find</>}
                      </Button>
                    </div>
                  </div>

                  {/* Address results */}
                  {addressResults.length > 0 && !manualAddress && (
                    <div className="bg-muted/30 border border-white/8 rounded-xl overflow-hidden">
                      <p className="text-xs text-muted-foreground px-3 pt-3 pb-1 font-medium">Select your address:</p>
                      {addressResults.map((addr, i) => (
                        <button key={i} onClick={() => selectAddress(addr)}
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-white/5 flex items-center gap-2 transition-colors border-t border-white/5 first:border-0">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          {addr.label}
                        </button>
                      ))}
                      <button onClick={() => { setManualAddress(true); setAddressResults([]); }}
                        className="w-full text-left px-3 py-2.5 text-xs text-primary hover:bg-white/5 border-t border-white/8 transition-colors">
                        I don't see my address — enter manually
                      </button>
                    </div>
                  )}

                  {addressSearched && !addressResults.length && !manualAddress && (
                    <button onClick={() => setManualAddress(true)} className="text-xs text-primary hover:underline">
                      Enter address manually
                    </button>
                  )}

                  {!addressSearched && !manualAddress && form.postcode.trim() === '' && (
                    <button onClick={() => setManualAddress(true)} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      Enter address manually instead
                    </button>
                  )}

                  {/* Manual address fields */}
                  {manualAddress && (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Address Line 1 *</label>
                        <Input value={form.addressLine1} onChange={e => update('addressLine1', e.target.value)} placeholder="123 High Street" className="bg-muted/50 border-white/8" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Address Line 2</label>
                        <Input value={form.addressLine2} onChange={e => update('addressLine2', e.target.value)} placeholder="Flat 2, Apartment B (optional)" className="bg-muted/50 border-white/8" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">City / Town *</label>
                        <Input value={form.city} onChange={e => update('city', e.target.value)} placeholder="London" className="bg-muted/50 border-white/8" />
                      </div>
                    </div>
                  )}

                  {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button onClick={handleNext} disabled={loading} className="bg-primary hover:bg-primary/90">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Next — Verify Email <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 1: Email Verification */}
          {step === 1 && (
            <motion.div key="verify" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="glass rounded-2xl p-7 border border-white/5 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Verify your email</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  We've sent a 6-digit code to <span className="text-foreground font-medium">{form.email}</span>. Enter it below to continue.
                </p>

                <div className="flex justify-center gap-2 mb-6">
                  {[0,1,2,3,4,5].map(i => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      value={code[i] || ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        const arr = code.split('');
                        arr[i] = val;
                        const next = arr.join('').slice(0, 6);
                        setCode(next);
                        if (val && i < 5) {
                          const inputs = document.querySelectorAll('.code-input');
                          inputs[i + 1]?.focus();
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Backspace' && !code[i] && i > 0) {
                          const inputs = document.querySelectorAll('.code-input');
                          inputs[i - 1]?.focus();
                        }
                      }}
                      className="code-input w-11 h-14 text-center text-xl font-bold bg-muted/50 border border-white/10 rounded-xl focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  ))}
                </div>

                {verifyError && <p className="text-sm text-red-400 mb-4">{verifyError}</p>}

                <Button onClick={handleVerify} disabled={code.length < 6} className="w-full bg-primary hover:bg-primary/90 mb-4">
                  <Check className="w-4 h-4 mr-2" /> Verify Email
                </Button>

                <p className="text-xs text-muted-foreground">
                  Didn't receive it?{' '}
                  <button onClick={resendCode} disabled={resending} className="text-primary hover:underline inline-flex items-center gap-1">
                    {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Resend code
                  </button>
                </p>

                <button onClick={() => setStep(0)} className="text-xs text-muted-foreground hover:text-foreground mt-3 block mx-auto transition-colors">
                  ← Use a different email
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: All Set */}
          {step === 2 && (
            <motion.div key="allset" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="glass rounded-2xl p-10 border border-white/5 text-center">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500/30"
                >
                  <Check className="w-10 h-10 text-green-400" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Email verified! 🎉</h2>
                <p className="text-muted-foreground mb-2 text-sm">Welcome, <span className="text-foreground font-semibold">{form.firstName}</span>!</p>
                <p className="text-muted-foreground text-sm mb-8">Your account details are saved. Now let's finish setting up your profile.</p>

                <Button
                  onClick={() => navigate('/RoleSelect')}
                  className="bg-primary hover:bg-primary/90 w-full text-base py-5"
                >
                  Continue Setting Up <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <p className="text-xs text-muted-foreground mt-4">You'll choose your role and personalise your experience next.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}