import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  BriefcaseBusiness,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings,
  Upload,
  Users,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { getNavItems } from '@/lib/navItems';
import { EmptyState, PageHero, SectionTitle } from '@/components/ui/PagePrimitives';

const EMPTY_FORM = {
  company_name: '',
  contact_person: '',
  company_email: '',
  phone: '',
  industry: '',
  company_size: '1-10',
  cities: '',
  booking_needs: '',
  invoice_preference: 'monthly',
  logo_url: '',
  status: 'active',
};

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
const INVOICE_OPTIONS = [
  { value: 'per_booking', label: 'Per task' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

function toPayload(form) {
  return {
    ...form,
    cities: form.cities.split(',').map(city => city.trim()).filter(Boolean),
  };
}

export default function EnterpriseProfile() {
  const { user, loading } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['enterprise-profile-page', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.EnterpriseProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['enterprise-profile-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ client_email: user.email, client_type: 'enterprise' }, '-created_date', 100),
    enabled: !!user,
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      company_name: profile.company_name || '',
      contact_person: profile.contact_person || '',
      company_email: profile.company_email || '',
      phone: profile.phone || '',
      industry: profile.industry || '',
      company_size: profile.company_size || '1-10',
      cities: (profile.cities || []).join(', '),
      booking_needs: profile.booking_needs || '',
      invoice_preference: profile.invoice_preference || 'monthly',
      logo_url: profile.logo_url || '',
      status: profile.status || 'active',
    });
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: (updates) => base44.entities.EnterpriseProfile.update(profile.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-profile-page'] });
      queryClient.invalidateQueries({ queryKey: ['enterprise-profile-settings'] });
      queryClient.invalidateQueries({ queryKey: ['enterprise-profile'] });
      queryClient.invalidateQueries({ queryKey: ['enterprise-billing-profile'] });
      toast({ title: 'Profile saved', description: 'Enterprise profile and settings are up to date.' });
    },
    onError: () => {
      toast({ title: 'Could not save profile', variant: 'destructive' });
    },
  });

  const setField = (key) => (event) => {
    setForm(current => ({ ...current, [key]: event.target.value }));
  };

  const handleSave = () => {
    if (!profile?.id) return;
    updateProfile.mutate(toPayload(form));
  };

  const handleLogoUpload = async (file) => {
    if (!file || !profile?.id) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const nextForm = { ...form, logo_url: file_url };
      setForm(nextForm);
      await updateProfile.mutateAsync(toPayload(nextForm));
    } catch (error) {
      console.error('Failed to upload logo:', error);
      toast({ title: 'Upload failed', description: 'Could not upload company logo.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const profileHealth = useMemo(() => {
    const checks = [
      !!form.company_name,
      !!form.contact_person,
      !!form.company_email,
      form.cities.split(',').map(city => city.trim()).filter(Boolean).length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  if (loading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const activeBookings = bookings.filter(booking => ['accepted', 'scheduled', 'in_progress', 'live'].includes(booking.status));
  const totalSpend = bookings
    .filter(booking => ['paid', 'released'].includes(booking.payment_status) || booking.status === 'completed')
    .reduce((sum, booking) => sum + (booking.total_amount || booking.amount || 0), 0);
  const cities = form.cities.split(',').map(city => city.trim()).filter(Boolean);

  return (
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
      <div className="max-w-5xl space-y-6">
        <PageHero
          eyebrow="Enterprise profile"
          title={profile?.company_name || 'Company Profile'}
          description="Keep your company identity, operating details, billing preferences, and workspace settings in one clear profile."
          icon={Building2}
          actions={profile && (
            <Button onClick={handleSave} disabled={updateProfile.isPending} className="gap-2">
              {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save profile
            </Button>
          )}
          stats={[
            { label: 'Profile health', value: `${profileHealth}%` },
            { label: 'Active tasks', value: activeBookings.length },
            { label: 'Total spend', value: `$${totalSpend.toFixed(0)}` },
          ]}
        />

        {!profile ? (
          <EmptyState
            icon={Building2}
            title="No enterprise profile found"
            description="Complete enterprise onboarding before editing company profile and billing settings."
            action={<Button asChild><Link to="/Onboarding?role=enterprise">Complete onboarding</Link></Button>}
          />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <GlassCard className="p-5">
                <SectionTitle title="Company Identity" description="This is what Local Agents and internal account screens use to identify your workspace." />
                <div className="mt-5 grid gap-5 md:grid-cols-[160px_minmax(0,1fr)]">
                  <div>
                    <div className="group relative flex aspect-square w-32 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary text-3xl font-black text-primary">
                      {form.logo_url ? (
                        <img src={form.logo_url} alt="Company logo" className="h-full w-full object-cover" />
                      ) : (
                        form.company_name?.[0] || <Building2 className="h-9 w-9" />
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Upload a square logo for best results.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-muted-foreground">Company name</label>
                      <Input value={form.company_name} onChange={setField('company_name')} className="bg-card border-border" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted-foreground">Industry</label>
                      <Input value={form.industry} onChange={setField('industry')} className="bg-card border-border" placeholder="Real estate, logistics, retail..." />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted-foreground">Company size</label>
                      <select value={form.company_size} onChange={setField('company_size')} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm">
                        {COMPANY_SIZES.map(size => <option key={size} value={size}>{size} employees</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-5">
                <SectionTitle title="Primary Contact" description="Use a reachable operations contact for bookings, invoices, and account notices." />
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Contact person</label>
                    <Input value={form.contact_person} onChange={setField('contact_person')} className="bg-card border-border" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Company email</label>
                    <Input type="email" value={form.company_email} onChange={setField('company_email')} className="bg-card border-border" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Phone</label>
                    <Input value={form.phone} onChange={setField('phone')} className="bg-card border-border" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Account owner</label>
                    <Input value={user?.email || ''} readOnly className="bg-secondary/50 border-border text-muted-foreground" />
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-5">
                <SectionTitle title="Operations" description="Set where you usually need Local Agents and what kind of work your company books." />
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Service cities</label>
                    <Input value={form.cities} onChange={setField('cities')} className="bg-card border-border" placeholder="London, Paris, New York" />
                    <p className="mt-1 text-xs text-muted-foreground">Separate cities with commas.</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Typical task needs</label>
                    <Textarea value={form.booking_needs} onChange={setField('booking_needs')} rows={4} className="bg-card border-border resize-none" placeholder="Site checks, stock verification, property visits, local pickup, live walkthroughs..." />
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-5">
                <SectionTitle title="Profile Settings" description="Enterprise settings now live inside the company profile instead of a separate duplicate page." />
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Invoice preference</label>
                    <select value={form.invoice_preference} onChange={setField('invoice_preference')} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm">
                      {INVOICE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/35 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">Workspace active</p>
                      <p className="text-xs text-muted-foreground">Inactive profiles are hidden from enterprise workflows.</p>
                    </div>
                    <Switch
                      checked={form.status === 'active'}
                      onCheckedChange={(checked) => setForm(current => ({ ...current, status: checked ? 'active' : 'inactive' }))}
                    />
                  </div>
                </div>
              </GlassCard>
            </div>

            <aside className="space-y-4">
              <GlassCard className="p-5">
                <h2 className="text-sm font-semibold">Profile Readiness</h2>
                <div className="mt-4 space-y-3">
                  {[
                    { label: 'Company name', done: !!form.company_name },
                    { label: 'Primary contact', done: !!form.contact_person && !!form.company_email },
                    { label: 'Service cities', done: cities.length > 0 },
                    { label: 'Task needs', done: !!form.booking_needs },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 ${item.done ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-5">
                <h2 className="text-sm font-semibold">Quick Actions</h2>
                <div className="mt-4 grid gap-2">
                  <Button asChild variant="outline" className="justify-start">
                    <Link to="/EnterpriseTeam"><Users className="h-4 w-4" /> Team workspace</Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link to="/EnterpriseBilling"><CreditCard className="h-4 w-4" /> Billing and invoices</Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <Link to="/FindPeople"><BriefcaseBusiness className="h-4 w-4" /> Deploy agent</Link>
                  </Button>
                </div>
              </GlassCard>

              <GlassCard className="p-5">
                <h2 className="text-sm font-semibold">Workspace Snapshot</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {form.company_email || 'No billing email'}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {form.phone || 'No phone number'}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {cities.length ? `${cities.length} service cities` : 'No service cities'}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Settings className="h-4 w-4" /> {form.status === 'active' ? 'Active workspace' : 'Inactive workspace'}</div>
                </div>
              </GlassCard>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  );
}
