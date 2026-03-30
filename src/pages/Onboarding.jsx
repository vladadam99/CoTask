import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Check, Loader2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';

const CATEGORIES = [
  'City Guide', 'Property Walkthrough', 'Shopping Help', 'Event Attendance',
  'Queue & Errands', 'Family Support', 'Business Inspection', 'Training & Coaching',
  'Campus Help', 'Travel Assistance', 'Pets & Animals', 'Cars & Vehicles',
  'Mechanics', 'Plumbing', 'Electrical Work', 'Medical & Health',
  'Outdoors & Nature', 'Cleaning', 'Gardening', 'Pick Ups', 'Deliveries',
  'Cooking & Food', 'Dating & Social', 'Driving', 'Show Me Around',
  'Carers & Companionship', 'DIY & Repairs', 'Custom Request'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Arabic',
  'Mandarin Chinese', 'Japanese', 'Korean', 'Hindi', 'Russian', 'Dutch',
  'Polish', 'Turkish', 'Swedish', 'Danish', 'Norwegian', 'Greek', 'Hebrew'
];

const SKILLS_POOL = [
  'Live Streaming', 'Video Editing', 'Photography', 'Navigation', 'Driving',
  'First Aid', 'Translation', 'Customer Service', 'Sales', 'Technical Support',
  'Cooking', 'Gardening', 'Cleaning', 'Childcare', 'Elderly Care',
  'Fitness Training', 'Event Planning', 'Research', 'Admin & Office', 'IT Support'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM',
  '8:00 PM', '9:00 PM', '10:00 PM'];
const CURRENCIES = ['USD', 'GBP', 'EUR', 'CAD', 'AUD', 'JPY', 'INR', 'BRL', 'SGD', 'AED'];

// ───────── Chip toggle ─────────
function ChipToggle({ items, selected = [], onToggle, color = 'primary' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <button key={item} type="button" onClick={() => onToggle(item)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            selected.includes(item)
              ? color === 'primary' ? 'bg-primary text-white' : 'bg-blue-500 text-white'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}>
          {item}
        </button>
      ))}
    </div>
  );
}

// ───────── Tag input ─────────
function TagInput({ tags, onAdd, onRemove, placeholder }) {
  const [val, setVal] = useState('');
  const add = () => { if (val.trim() && !tags.includes(val.trim())) { onAdd(val.trim()); setVal(''); } };
  return (
    <div>
      <div className="flex gap-2 mb-2">
        <Input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={placeholder} className="bg-muted/50 border-white/5 flex-1 text-sm" />
        <Button type="button" onClick={add} size="sm" variant="outline" className="border-white/10"><Plus className="w-4 h-4" /></Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
            {t} <button onClick={() => onRemove(t)}><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

// ───────── Section header ─────────
function SectionTitle({ children, sub }) {
  return (
    <div className="mb-4">
      <h3 className="text-base font-bold">{children}</h3>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ═══════════════════════════════════════
//  USER STEPS
// ═══════════════════════════════════════
function UserStep1({ data, update, toggle }) {
  return (
    <div className="space-y-6">
      <SectionTitle sub="Select the services you're interested in. We'll personalise your experience.">
        What do you need help with?
      </SectionTitle>
      <ChipToggle items={CATEGORIES} selected={data.interests} onToggle={c => toggle('interests', c)} />
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Anything else? (type & press Enter)</label>
        <TagInput tags={data.custom_interests || []} onAdd={v => update('custom_interests', [...(data.custom_interests || []), v])}
          onRemove={v => update('custom_interests', (data.custom_interests || []).filter(x => x !== v))}
          placeholder="e.g. Wedding photography, Dog walking…" />
      </div>
    </div>
  );
}

function UserStep2({ data, update, toggle }) {
  return (
    <div className="space-y-6">
      <SectionTitle sub="Tell us a bit more so we can match you with the right people.">
        Your preferences
      </SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Your City</label>
          <Input value={data.city} onChange={e => update('city', e.target.value)} placeholder="London" className="bg-muted/50 border-white/5" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Country</label>
          <Input value={data.country} onChange={e => update('country', e.target.value)} placeholder="United Kingdom" className="bg-muted/50 border-white/5" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Preferred Languages</label>
        <ChipToggle items={LANGUAGES} selected={data.languages} onToggle={l => toggle('languages', l)} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">What are you looking for?</label>
        <Textarea value={data.looking_for} onChange={e => update('looking_for', e.target.value)}
          placeholder="e.g. I need someone to help me remotely tour properties in Barcelona before I move…"
          className="bg-muted/50 border-white/5 h-24 text-sm" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">How do you prefer to book?</label>
        <div className="grid grid-cols-2 gap-2">
          {['Instant / On-demand', 'Scheduled in advance', 'Both work for me'].map(opt => (
            <button key={opt} onClick={() => update('booking_preference', opt)}
              className={`px-3 py-2.5 rounded-xl text-sm text-left transition-all border ${data.booking_preference === opt ? 'border-primary bg-primary/10 text-primary' : 'border-white/8 bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Max budget per hour (optional)</label>
        <div className="flex gap-2">
          <Select value={data.currency} onValueChange={v => update('currency', v)}>
            <SelectTrigger className="bg-muted/50 border-white/5 w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" value={data.max_budget} onChange={e => update('max_budget', e.target.value)} placeholder="50" className="bg-muted/50 border-white/5" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//  AVATAR STEPS
// ═══════════════════════════════════════
function AvatarStep1({ data, update, toggle }) {
  return (
    <div className="space-y-5">
      <SectionTitle sub="This is what clients will see on your profile.">Basic Profile</SectionTitle>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Display Name *</label>
        <Input value={data.display_name} onChange={e => update('display_name', e.target.value)} placeholder="Your public name" className="bg-muted/50 border-white/5" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Bio / Headline *</label>
        <Input value={data.bio} onChange={e => update('bio', e.target.value)} placeholder="e.g. Local guide & experienced walker in Central London" className="bg-muted/50 border-white/5" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Full Description</label>
        <Textarea value={data.description} onChange={e => update('description', e.target.value)}
          placeholder="Tell clients about yourself, your experience, and why they should book you…"
          className="bg-muted/50 border-white/5 h-32 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">City *</label>
          <Input value={data.city} onChange={e => update('city', e.target.value)} placeholder="London" className="bg-muted/50 border-white/5" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Country *</label>
          <Input value={data.country} onChange={e => update('country', e.target.value)} placeholder="United Kingdom" className="bg-muted/50 border-white/5" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Languages Spoken</label>
        <ChipToggle items={LANGUAGES} selected={data.languages} onToggle={l => toggle('languages', l)} />
      </div>
    </div>
  );
}

function AvatarStep2({ data, update, toggle }) {
  return (
    <div className="space-y-5">
      <SectionTitle sub="Select the services you offer and your skills.">Services & Skills</SectionTitle>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Services I offer</label>
        <ChipToggle items={CATEGORIES} selected={data.categories} onToggle={c => toggle('categories', c)} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">My Skills</label>
        <ChipToggle items={SKILLS_POOL} selected={data.skills} onToggle={s => toggle('skills', s)} />
        <div className="mt-2">
          <TagInput tags={data.custom_skills || []} onAdd={v => update('custom_skills', [...(data.custom_skills || []), v])}
            onRemove={v => update('custom_skills', (data.custom_skills || []).filter(x => x !== v))}
            placeholder="Add a custom skill…" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">What can you do for clients?</label>
        <Textarea value={data.what_can_do} onChange={e => update('what_can_do', e.target.value)}
          placeholder="Describe specifically what tasks you are able to perform…"
          className="bg-muted/50 border-white/5 h-24 text-sm" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">What are you willing to do?</label>
        <Textarea value={data.willing_to_do} onChange={e => update('willing_to_do', e.target.value)}
          placeholder="Are there tasks outside your category you'd still accept? Any limits? Be honest."
          className="bg-muted/50 border-white/5 h-24 text-sm" />
      </div>
    </div>
  );
}

function AvatarStep3({ data, update, toggle }) {
  return (
    <div className="space-y-5">
      <SectionTitle sub="Let clients know when you're available.">Availability & Location</SectionTitle>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Days Available</label>
        <ChipToggle items={DAYS} selected={data.available_days} onToggle={d => toggle('available_days', d)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Available From</label>
          <Select value={data.available_from} onValueChange={v => update('available_from', v)}>
            <SelectTrigger className="bg-muted/50 border-white/5"><SelectValue placeholder="Start time" /></SelectTrigger>
            <SelectContent>{HOURS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Available Until</label>
          <Select value={data.available_to} onValueChange={v => update('available_to', v)}>
            <SelectTrigger className="bg-muted/50 border-white/5"><SelectValue placeholder="End time" /></SelectTrigger>
            <SelectContent>{HOURS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Other cities I cover</label>
        <TagInput tags={data.other_cities || []} onAdd={v => update('other_cities', [...(data.other_cities || []), v])}
          onRemove={v => update('other_cities', (data.other_cities || []).filter(x => x !== v))}
          placeholder="Add a city…" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Willing to travel?</label>
        <div className="grid grid-cols-3 gap-2">
          {['No', 'Within city', 'Nationally', 'Internationally'].map(opt => (
            <button key={opt} onClick={() => update('travel_willingness', opt)}
              className={`px-3 py-2 rounded-xl text-sm text-center transition-all border ${data.travel_willingness === opt ? 'border-primary bg-primary/10 text-primary' : 'border-white/8 bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Max travel distance (km, optional)</label>
        <Input type="number" value={data.max_travel_km} onChange={e => update('max_travel_km', e.target.value)} placeholder="50" className="bg-muted/50 border-white/5" />
      </div>
    </div>
  );
}

function AvatarStep4({ data, update }) {
  return (
    <div className="space-y-5">
      <SectionTitle sub="Set your rates and how you prefer to work.">Pricing & Working Style</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Hourly Rate</label>
          <Input type="number" value={data.hourly_rate} onChange={e => update('hourly_rate', e.target.value)} placeholder="30" className="bg-muted/50 border-white/5" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Currency</label>
          <Select value={data.currency} onValueChange={v => update('currency', v)}>
            <SelectTrigger className="bg-muted/50 border-white/5"><SelectValue /></SelectTrigger>
            <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Per-session rate (optional)</label>
        <Input type="number" value={data.per_session_rate} onChange={e => update('per_session_rate', e.target.value)} placeholder="e.g. 80 for a 2-hour session" className="bg-muted/50 border-white/5" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Is your rate negotiable?</label>
        <div className="flex gap-2">
          {['Yes, flexible', 'Fixed rate', 'Depends on the job'].map(opt => (
            <button key={opt} onClick={() => update('price_negotiable', opt)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs text-center transition-all border ${data.price_negotiable === opt ? 'border-primary bg-primary/10 text-primary' : 'border-white/8 bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Job types you accept</label>
        <div className="grid grid-cols-2 gap-2">
          {['Instant / On-demand', 'Scheduled in advance', 'Live camera jobs', 'No-camera jobs only'].map(opt => (
            <button key={opt} onClick={() => {
              const list = data.job_types || [];
              update('job_types', list.includes(opt) ? list.filter(x => x !== opt) : [...list, opt]);
            }}
              className={`px-3 py-2.5 rounded-xl text-sm text-left transition-all border ${(data.job_types || []).includes(opt) ? 'border-primary bg-primary/10 text-primary' : 'border-white/8 bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Equipment you have</label>
        <div className="flex flex-wrap gap-2">
          {['Smartphone', '360° Camera', 'Headset / Earpiece', 'Vehicle', 'Bicycle', 'Laptop'].map(eq => (
            <button key={eq} onClick={() => {
              const list = data.equipment || [];
              update('equipment', list.includes(eq) ? list.filter(x => x !== eq) : [...list, eq]);
            }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${(data.equipment || []).includes(eq) ? 'border-primary bg-primary/10 text-primary' : 'border-white/8 bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
              {eq}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//  ENTERPRISE STEPS
// ═══════════════════════════════════════
function EnterpriseStep1({ data, update }) {
  return (
    <div className="space-y-5">
      <SectionTitle sub="Tell us about your business.">Company Information</SectionTitle>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Company Name *</label>
        <Input value={data.company_name} onChange={e => update('company_name', e.target.value)} placeholder="Acme Corp" className="bg-muted/50 border-white/5" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Contact Person *</label>
          <Input value={data.contact_person} onChange={e => update('contact_person', e.target.value)} placeholder="Jane Smith" className="bg-muted/50 border-white/5" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Phone</label>
          <Input value={data.phone} onChange={e => update('phone', e.target.value)} placeholder="+44 20 7000 0000" className="bg-muted/50 border-white/5" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Industry *</label>
        <Select value={data.industry} onValueChange={v => update('industry', v)}>
          <SelectTrigger className="bg-muted/50 border-white/5"><SelectValue placeholder="Select industry" /></SelectTrigger>
          <SelectContent>
            {['Real Estate', 'Construction', 'Retail', 'Technology', 'Healthcare', 'Education',
              'Logistics & Delivery', 'Manufacturing', 'Media & Entertainment', 'Financial Services',
              'Hospitality & Tourism', 'Legal', 'Insurance', 'Government', 'Other'].map(i => (
              <SelectItem key={i} value={i}>{i}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Company Size</label>
        <Select value={data.company_size} onValueChange={v => update('company_size', v)}>
          <SelectTrigger className="bg-muted/50 border-white/5"><SelectValue placeholder="Number of employees" /></SelectTrigger>
          <SelectContent>
            {['1–10', '11–50', '51–200', '201–1000', '1000+'].map(s => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function EnterpriseStep2({ data, update, toggle }) {
  return (
    <div className="space-y-5">
      <SectionTitle sub="Where do you need avatars and what for?">Operational Needs</SectionTitle>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Cities / Regions you need coverage in</label>
        <TagInput tags={data.cities || []} onAdd={v => update('cities', [...(data.cities || []), v])}
          onRemove={v => update('cities', (data.cities || []).filter(x => x !== v))}
          placeholder="Add a city or region…" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">What services do you need?</label>
        <ChipToggle items={CATEGORIES} selected={data.needs_categories} onToggle={c => toggle('needs_categories', c)} />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Describe your booking needs</label>
        <Textarea value={data.booking_needs} onChange={e => update('booking_needs', e.target.value)}
          placeholder="e.g. We need 5–10 avatars per week to conduct live property tours across London…"
          className="bg-muted/50 border-white/5 h-24 text-sm" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Preferred job frequency</label>
        <div className="grid grid-cols-2 gap-2">
          {['Daily', 'Weekly', 'Monthly', 'One-off projects', 'Ongoing contract', 'As needed'].map(opt => (
            <button key={opt} onClick={() => {
              const list = data.job_frequency || [];
              update('job_frequency', list.includes(opt) ? list.filter(x => x !== opt) : [...list, opt]);
            }}
              className={`px-3 py-2 rounded-xl text-sm text-left transition-all border ${(data.job_frequency || []).includes(opt) ? 'border-primary bg-primary/10 text-primary' : 'border-white/8 bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EnterpriseStep3({ data, update }) {
  return (
    <div className="space-y-5">
      <SectionTitle sub="Set your preferred billing and team settings.">Budget & Billing</SectionTitle>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Monthly budget estimate (optional)</label>
        <div className="flex gap-2">
          <Select value={data.currency} onValueChange={v => update('currency', v)}>
            <SelectTrigger className="bg-muted/50 border-white/5 w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" value={data.monthly_budget} onChange={e => update('monthly_budget', e.target.value)} placeholder="5000" className="bg-muted/50 border-white/5" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Invoice preference</label>
        <div className="flex gap-2">
          {['Per booking', 'Monthly invoice', 'Quarterly invoice'].map(opt => (
            <button key={opt} onClick={() => update('invoice_preference', opt)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs text-center transition-all border ${data.invoice_preference === opt ? 'border-primary bg-primary/10 text-primary' : 'border-white/8 bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Do you need live camera streams?</label>
        <div className="flex gap-2">
          {['Yes, essential', 'Sometimes', 'No, not needed'].map(opt => (
            <button key={opt} onClick={() => update('needs_live_stream', opt)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs text-center transition-all border ${data.needs_live_stream === opt ? 'border-primary bg-primary/10 text-primary' : 'border-white/8 bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Languages required in avatars</label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.slice(0, 10).map(l => (
            <button key={l} onClick={() => {
              const list = data.required_languages || [];
              update('required_languages', list.includes(l) ? list.filter(x => x !== l) : [...list, l]);
            }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${(data.required_languages || []).includes(l) ? 'bg-primary text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════
export default function Onboarding() {
  const { user, loading, updateUser } = useCurrentUser();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState('user');
  const [formData, setFormData] = useState({
    // shared
    city: '', country: '', currency: 'USD',
    // user
    interests: [], custom_interests: [], languages: [], looking_for: '',
    booking_preference: '', max_budget: '',
    // avatar
    display_name: '', bio: '', description: '', categories: [], skills: [],
    custom_skills: [], what_can_do: '', willing_to_do: '',
    available_days: [], available_from: '', available_to: '',
    other_cities: [], travel_willingness: '', max_travel_km: '',
    hourly_rate: '', per_session_rate: '', price_negotiable: '',
    job_types: [], equipment: [],
    // enterprise
    company_name: '', contact_person: '', phone: '', industry: '',
    company_size: '', booking_needs: '', cities: [], needs_categories: [],
    job_frequency: [], monthly_budget: '', invoice_preference: '', 
    needs_live_stream: '', required_languages: [],
  });

  const regData = (() => {
    try { return JSON.parse(localStorage.getItem('cotask_reg') || '{}'); } catch { return {}; }
  })();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get('role') || localStorage.getItem('cotask_role') || 'user';
    setRole(urlRole);
    localStorage.removeItem('cotask_role');
    if (user) setFormData(p => ({ ...p, display_name: user.full_name || '' }));
  }, [user]);

  useEffect(() => {
    if (!loading && user && user.onboarding_complete && user.role === role) {
      const dest = role === 'avatar' ? '/AvatarDashboard' : role === 'enterprise' ? '/EnterpriseDashboard' : '/UserDashboard';
      window.location.href = dest;
    }
  }, [user, loading, role]);

  const update = (k, v) => setFormData(p => ({ ...p, [k]: v }));
  const toggle = (k, val) => {
    const list = formData[k] || [];
    update(k, list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
  };

  const STEPS_CONFIG = {
    user: [
      { label: 'What you need', component: <UserStep1 data={formData} update={update} toggle={toggle} /> },
      { label: 'Preferences', component: <UserStep2 data={formData} update={update} toggle={toggle} /> },
    ],
    avatar: [
      { label: 'Your Profile', component: <AvatarStep1 data={formData} update={update} toggle={toggle} /> },
      { label: 'Services & Skills', component: <AvatarStep2 data={formData} update={update} toggle={toggle} /> },
      { label: 'Availability', component: <AvatarStep3 data={formData} update={update} toggle={toggle} /> },
      { label: 'Pricing', component: <AvatarStep4 data={formData} update={update} toggle={toggle} /> },
    ],
    enterprise: [
      { label: 'Company Info', component: <EnterpriseStep1 data={formData} update={update} toggle={toggle} /> },
      { label: 'Operations', component: <EnterpriseStep2 data={formData} update={update} toggle={toggle} /> },
      { label: 'Budget & Billing', component: <EnterpriseStep3 data={formData} update={update} toggle={toggle} /> },
    ],
  };

  const steps = STEPS_CONFIG[role] || STEPS_CONFIG.user;
  const totalSteps = steps.length;

  const finish = async () => {
    setSubmitting(true);
    try {
      if (!user) {
        localStorage.setItem('cotask_role', role);
        base44.auth.redirectToLogin('/Onboarding');
        return;
      }

      await updateUser({
        role,
        onboarding_complete: true,
        city: formData.city,
        country: formData.country,
        interests: [...(formData.interests || []), ...(formData.custom_interests || [])],
        preferred_language: (formData.languages || [])[0] || 'English',
        phone: regData.phone || formData.phone || '',
        address: regData.address || '',
        postcode: regData.postcode || '',
      });

      if (role === 'avatar') {
        const existing = await base44.entities.AvatarProfile.filter({ user_email: user.email });
        const profileData = {
          user_email: user.email,
          display_name: formData.display_name || user.full_name,
          bio: formData.bio,
          city: formData.city,
          country: formData.country,
          categories: formData.categories,
          languages: formData.languages,
          skills: [...(formData.skills || []), ...(formData.custom_skills || [])],
          hourly_rate: parseFloat(formData.hourly_rate) || 30,
          per_session_rate: parseFloat(formData.per_session_rate) || 0,
          currency: formData.currency,
          is_available: true,
          has_smartphone: (formData.equipment || []).includes('Smartphone'),
          has_360_camera: (formData.equipment || []).includes('360° Camera'),
          has_headset: (formData.equipment || []).includes('Headset / Earpiece'),
          has_vehicle: (formData.equipment || []).includes('Vehicle'),
        };
        if (existing.length === 0) await base44.entities.AvatarProfile.create(profileData);
        else await base44.entities.AvatarProfile.update(existing[0].id, profileData);
      } else if (role === 'enterprise') {
        const existing = await base44.entities.EnterpriseProfile.filter({ user_email: user.email });
        const entData = {
          user_email: user.email,
          company_name: formData.company_name,
          contact_person: formData.contact_person || user.full_name,
          company_email: user.email,
          phone: formData.phone,
          industry: formData.industry,
          company_size: formData.company_size,
          cities: formData.cities,
          booking_needs: formData.booking_needs,
          invoice_preference: formData.invoice_preference?.toLowerCase().replace(/ /g, '_').replace('per_booking', 'per_booking') || 'per_booking',
        };
        if (existing.length === 0) await base44.entities.EnterpriseProfile.create(entData);
        else await base44.entities.EnterpriseProfile.update(existing[0].id, entData);
      }

      const dest = role === 'avatar' ? '/AvatarDashboard' : role === 'enterprise' ? '/EnterpriseDashboard' : '/UserDashboard';
      window.location.href = dest;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const ROLE_TITLES = {
    user: 'Personalise your experience',
    avatar: 'Build your Avatar profile',
    enterprise: 'Set up your business',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="text-xl font-bold tracking-tight mb-5 inline-block">
            Co<span className="text-primary">Task</span>
          </a>
          <h1 className="text-2xl font-bold mb-1">{ROLE_TITLES[role]}</h1>
          <p className="text-sm text-muted-foreground mb-4">Step {step + 1} of {totalSteps} — {steps[step]?.label}</p>

          {/* Progress bar */}
          <div className="flex gap-1.5 justify-center">
            {steps.map((s, i) => (
              <div key={i} title={s.label}
                className={`h-1.5 rounded-full transition-all duration-300 ${i < step ? 'bg-green-500' : i === step ? 'bg-primary' : 'bg-muted'}`}
                style={{ width: `${Math.max(40, 200 / totalSteps)}px` }} />
            ))}
          </div>
        </div>

        <GlassCard className="p-8">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {steps[step]?.component}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => window.history.back()} className="text-muted-foreground">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            {step < totalSteps - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} className="bg-primary hover:bg-primary/90">
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={submitting} className="bg-primary hover:bg-primary/90">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                {role === 'user' ? 'Start Exploring' : role === 'avatar' ? 'Launch my Profile' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </GlassCard>

        {role === 'user' && step === 0 && (
          <p className="text-center mt-4 text-sm text-muted-foreground">
            <button onClick={() => window.location.href = '/Explore'} className="text-primary hover:underline">
              Skip and browse now →
            </button>
          </p>
        )}
      </div>
    </div>
  );
}