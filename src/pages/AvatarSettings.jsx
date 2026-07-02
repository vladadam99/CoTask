import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { getNavItems } from '@/lib/navItems';
import {
  ArrowRightLeft,
  BadgeCheck,
  CalendarDays,
  Car,
  CreditCard,
  Headphones,
  LogOut,
  Moon,
  Radio,
  Shield,
  Smartphone,
  Sun,
  UserRound,
  Wallet,
} from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { PageHero } from '@/components/ui/PagePrimitives';

const DEFAULT_AGENT_SETTINGS = {
  is_available: false,
  willing_to_travel: false,
  has_smartphone: true,
  has_data_connection: true,
  has_headset: false,
  has_vehicle: false,
};

export default function AvatarSettings() {
  const { user, loading } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { theme, setTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [switchingRole, setSwitchingRole] = useState(false);
  const [agentSettings, setAgentSettings] = useState(DEFAULT_AGENT_SETTINGS);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['avatar-profile-settings', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.AvatarProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!profile) return;
    setAgentSettings({
      is_available: profile.is_available || false,
      willing_to_travel: profile.willing_to_travel || false,
      has_smartphone: profile.has_smartphone ?? true,
      has_data_connection: profile.has_data_connection ?? true,
      has_headset: profile.has_headset || false,
      has_vehicle: profile.has_vehicle || false,
    });
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: (updates) => base44.entities.AvatarProfile.update(profile.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatar-profile-settings'] });
      queryClient.invalidateQueries({ queryKey: ['avatar-profile'] });
      toast({ title: 'Settings saved' });
    },
  });

  const updateSetting = (key, value) => {
    setAgentSettings(current => ({ ...current, [key]: value }));
    if (profile?.id) updateProfile.mutate({ [key]: value });
  };

  const handleSwitchRole = async (targetRole) => {
    if (targetRole === user?.selected_role) return;
    setSwitchingRole(true);
    try {
      await base44.auth.updateMe({ selected_role: targetRole });
      await new Promise(resolve => setTimeout(resolve, 300));
      if (targetRole === 'avatar') {
        const profiles = await base44.entities.AvatarProfile.filter({ user_email: user.email });
        navigate(profiles.length > 0 ? '/AvatarDashboard' : '/Onboarding?role=avatar');
      } else if (targetRole === 'enterprise') {
        const profiles = await base44.entities.EnterpriseProfile.filter({ user_email: user.email });
        navigate(profiles.length > 0 ? '/EnterpriseDashboard' : '/Onboarding?role=enterprise');
      } else {
        const hasUserProfile = user?.interests?.length > 0 || user?.what_need_help_with;
        navigate(hasUserProfile ? '/UserDashboard' : '/Onboarding?role=user');
      }
    } catch (error) {
      console.error('Failed to switch role:', error);
      toast({ title: 'Could not switch role', variant: 'destructive' });
    } finally {
      setSwitchingRole(false);
    }
  };

  if (loading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const verificationStatus = user?.identity_verified ? 'verified' : (profile?.verification_status || user?.identity_verification_status || 'pending');
  const verificationReady = verificationStatus === 'verified';
  const payoutStatus = profile?.payout_status || 'not_connected';
  const profileReady = !!(profile?.display_name && profile?.city && profile?.categories?.length);

  const capabilityItems = [
    { key: 'has_smartphone', icon: Smartphone, label: 'Smartphone' },
    { key: 'has_data_connection', icon: Radio, label: 'Reliable data' },
    { key: 'has_headset', icon: Headphones, label: 'Headset' },
    { key: 'has_vehicle', icon: Car, label: 'Vehicle' },
  ];

  const roleOptions = [
    { key: 'user', label: 'Client' },
    { key: 'avatar', label: 'Local Agent' },
    { key: 'enterprise', label: 'Enterprise' },
  ].filter(role => role.key !== (user?.selected_role || user?.role));

  return (
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
      <div className="max-w-4xl space-y-6">
        <PageHero
          eyebrow="Agent account"
          title="Settings"
          description="Manage your agent readiness, trust checks, payout setup, appearance, and account access."
          icon={Shield}
          stats={[
            { label: 'Availability', value: agentSettings.is_available ? 'Online' : 'Offline' },
            { label: 'Profile', value: profileReady ? 'Ready' : 'Needs work' },
            { label: 'Verification', value: verificationReady ? 'Verified' : 'Pending' },
          ]}
        />

        {!profile ? (
          <GlassCard className="p-8 text-center">
            <UserRound className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-semibold">No agent profile found</p>
            <p className="mt-1 text-sm text-muted-foreground">Complete agent onboarding before changing agent settings.</p>
            <button onClick={() => navigate('/Onboarding?role=avatar')} className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground">
              Complete onboarding
            </button>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <button onClick={() => navigate('/AvatarProfileEdit')} className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/40">
                <UserRound className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">Public profile</p>
                <p className="mt-1 text-xs text-muted-foreground">{profileReady ? 'Profile details are ready.' : 'Add profile, city, and categories.'}</p>
              </button>
              <button onClick={() => navigate('/IdentityVerification')} className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/40">
                <BadgeCheck className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">Identity verification</p>
                <p className="mt-1 text-xs text-muted-foreground capitalize">{verificationReady ? 'Verified account.' : `${verificationStatus} verification.`}</p>
              </button>
              <button onClick={() => navigate('/AvatarWallet?payout=settings')} className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/40">
                <Wallet className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">Payout settings</p>
                <p className="mt-1 text-xs text-muted-foreground capitalize">{payoutStatus.replace('_', ' ')}</p>
              </button>
            </div>

            <GlassCard className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Availability</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Available for new tasks</p>
                      <p className="text-xs text-muted-foreground">{agentSettings.is_available ? 'Clients can find you in search.' : 'You are hidden from available-agent search.'}</p>
                    </div>
                  </div>
                  <Switch checked={agentSettings.is_available} onCheckedChange={(value) => updateSetting('is_available', value)} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Willing to travel</p>
                      <p className="text-xs text-muted-foreground">Used for nearby and travel-friendly task matching.</p>
                    </div>
                  </div>
                  <Switch checked={agentSettings.willing_to_travel} onCheckedChange={(value) => updateSetting('willing_to_travel', value)} />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Equipment</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {capabilityItems.map(item => (
                  <div key={item.key} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/35 px-3 py-3">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <Switch checked={agentSettings[item.key]} onCheckedChange={(value) => updateSetting(item.key, value)} />
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Trust and Payments</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-secondary/35 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Identity</p>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">Status: {verificationStatus}</p>
                  {!verificationReady && (
                    <button onClick={() => navigate('/IdentityVerification')} className="mt-3 text-xs font-semibold text-primary hover:underline">
                      Start verification
                    </button>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-secondary/35 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Payouts</p>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">Status: {payoutStatus.replace('_', ' ')}</p>
                  <button onClick={() => navigate('/AvatarWallet?payout=settings')} className="mt-3 text-xs font-semibold text-primary hover:underline">
                    Open payout settings
                  </button>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Appearance</h2>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                    <p className="text-xs text-muted-foreground">Choose the app appearance.</p>
                  </div>
                </div>
                <button onClick={toggleTheme} className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/80">
                  Switch
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { id: 'light', label: 'Light', color: '#f5f5f5', dot: '#e8304a' },
                  { id: 'dark', label: 'Dark', color: '#161c26', dot: '#e8304a' },
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => setTheme(option.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 py-2 text-xs font-medium transition-all ${theme === option.id ? 'border-primary' : 'border-border'}`}
                    style={{ background: option.color }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: option.dot, display: 'block' }} />
                    <span style={{ color: option.id === 'dark' ? '#fff' : '#111' }}>{option.label}</span>
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Account</h2>
              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <p><span className="block text-xs text-muted-foreground">Email</span><span className="font-medium text-foreground">{user?.email}</span></p>
                <p><span className="block text-xs text-muted-foreground">Name</span><span className="font-medium text-foreground">{user?.full_name || 'Not set'}</span></p>
                <p><span className="block text-xs text-muted-foreground">Role</span><span className="font-medium text-foreground capitalize">{user?.selected_role || user?.role}</span></p>
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <h2 className="mb-4 text-sm font-semibold">Switch Role</h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {roleOptions.map(role => (
                  <button
                    key={role.key}
                    onClick={() => handleSwitchRole(role.key)}
                    disabled={switchingRole}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-3 text-sm transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    {switchingRole ? 'Switching...' : role.label}
                  </button>
                ))}
              </div>
            </GlassCard>

            <button onClick={() => base44.auth.logout('/Landing')} className="w-full text-left">
              <GlassCard className="p-4 flex items-center gap-3" hover>
                <LogOut className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-red-500">Sign out</span>
              </GlassCard>
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
