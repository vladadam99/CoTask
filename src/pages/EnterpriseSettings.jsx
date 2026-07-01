import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Save, Upload, Loader2
} from 'lucide-react';
import { getNavItems } from '@/lib/navItems';

export default function EnterpriseSettings() {
  const { user, loading } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['enterprise-profile-settings', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.EnterpriseProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const [form, setForm] = useState({
    company_name: '', contact_person: '', company_email: '',
    phone: '', industry: '', company_size: '1-10',
    cities: '', booking_needs: '', invoice_preference: 'monthly',
    logo_url: '',
  });

  useEffect(() => {
    if (profile) {
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
      });
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: (data) => base44.entities.EnterpriseProfile.update(profile.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-profile-settings'] });
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
    },
  });

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, logo_url: file_url }));
      updateProfile.mutate({ ...form, logo_url: file_url });
    } catch (error) {
      console.error('Failed to upload logo:', error);
      toast({ title: 'Upload failed', description: 'Could not upload logo' });
    }
    setUploading(false);
  };

  const handleSave = () => {
    updateProfile.mutate({
      ...form,
      cities: form.cities.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
      <div className="surface-panel rounded-lg p-5 md:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <p className="section-label">Enterprise account</p>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">Company Settings</h1>
          <p className="text-muted-foreground text-sm">Update company profile, operations, service cities, and billing preferences.</p>
        </div>
        <Button onClick={handleSave} disabled={updateProfile.isPending || !profile} className="gap-2">
          <Save className="w-4 h-4" /> {updateProfile.isPending ? 'Saving???' : 'Save Changes'}
        </Button>
      </div>

      {!profile ? (
        <GlassCard className="p-10 text-center">
          <p className="text-muted-foreground text-sm">No enterprise profile found. Complete onboarding first.</p>
        </GlassCard>
      ) : (
        <div className="space-y-6 max-w-3xl">
          {/* Logo */}
          <GlassCard className="p-5">
            <h2 className="font-semibold text-sm mb-4">Company Logo</h2>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary overflow-hidden group">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  form.company_name?.[0] || 'E'
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Upload className="w-4 h-4 text-white" />}
                </button>
              </div>
              <div>
                <p className="text-sm font-medium">Company Logo</p>
                <p className="text-xs text-muted-foreground">Hover to upload</p>
              </div>
            </div>
          </GlassCard>

          {/* Basic Info */}
          <GlassCard className="p-5 space-y-4">
            <h2 className="font-semibold text-sm">Company Information</h2>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Company Name</label>
              <Input value={form.company_name} onChange={set('company_name')} className="bg-card border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Contact Person</label>
                <Input value={form.contact_person} onChange={set('contact_person')} className="bg-card border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Industry</label>
                <Input value={form.industry} onChange={set('industry')} className="bg-card border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <Input type="email" value={form.company_email} onChange={set('company_email')} className="bg-card border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                <Input value={form.phone} onChange={set('phone')} className="bg-card border-border" />
              </div>
            </div>
          </GlassCard>

          {/* Operations */}
          <GlassCard className="p-5 space-y-4">
            <h2 className="font-semibold text-sm">Operations</h2>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Company Size</label>
              <select value={form.company_size} onChange={set('company_size')} className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm">
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-1000">201-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Service Cities (comma-separated)</label>
              <Input value={form.cities} onChange={set('cities')} className="bg-card border-border" placeholder="e.g. New York, London, Tokyo" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Invoice Preference</label>
              <select value={form.invoice_preference} onChange={set('invoice_preference')} className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm">
                <option value="per_booking">Per Booking</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Booking Needs</label>
              <Textarea value={form.booking_needs} onChange={set('booking_needs')} rows={3} className="bg-card border-border resize-none" placeholder="Describe your typical booking needs..." />
            </div>
          </GlassCard>
        </div>
      )}
    </AppShell>
  );
}

