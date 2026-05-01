import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { getNavItems } from '@/lib/navItems';
import {
  Settings, Shield, Radio, Smartphone, Camera, Headphones, Car, Sun, Moon, ArrowRightLeft, LogOut
} from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { useNavigate } from 'react-router-dom';



export default function AvatarSettings() {
  const { user, loading } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [switchingRole, setSwitchingRole] = useState(false);

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
    } finally {
      setSwitchingRole(false);
    }
  };

  const { data: profile } = useQuery({
    queryKey: ['avatar-profile-settings', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.AvatarProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const [equipment, setEquipment] = useState({
    has_360_camera: false,
    has_smartphone: true,
    has_data_connection: true,
    has_headset: false,
    has_vehicle: false,
  });

  useEffect(() => {
    if (profile) {
      setEquipment({
        has_360_camera: profile.has_360_camera || false,
        has_smartphone: profile.has_smartphone ?? true,
        has_data_connection: profile.has_data_connection ?? true,
        has_headset: profile.has_headset || false,
        has_vehicle: profile.has_vehicle || false,
      });
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: (data) => base44.entities.AvatarProfile.update(profile.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatar-profile-settings'] });
      toast({ title: 'Settings saved' });
    },
  });

  const toggle = (key) => {
    const updated = { ...equipment, [key]: !equipment[key] };
    setEquipment(updated);
    if (profile) updateProfile.mutate(updated);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const equipmentItems = [
    { key: 'has_smartphone', icon: Smartphone, label: '360° Smartphone', desc: 'Can stream via smartphone' },
    { key: 'has_360_camera', icon: Camera, label: '360° Camera', desc: 'Have a dedicated 360° camera', comingSoon: true },
    { key: 'has_data_connection', icon: Radio, label: 'Data Connection', desc: 'Reliable mobile data connection' },
    { key: 'has_headset', icon: Headphones, label: 'Headset / Earpiece', desc: 'Can use voice/AR headset' },
    { key: 'has_vehicle', icon: Car, label: 'Vehicle', desc: 'Can travel by vehicle for sessions' },
  ];

  return (
    <AppShell navItems={getNavItems(user?.role)} user={user}>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your equipment and account preferences</p>
      </div>

      {!profile ? (
        <GlassCard className="p-10 text-center">
          <p className="text-sm text-muted-foreground">No avatar profile found. Complete onboarding first.</p>
        </GlassCard>
      ) : (
        <div className="space-y-6 max-w-lg">
          {/* Equipment */}
          <GlassCard className="p-5">
            <h2 className="font-semibold text-sm mb-4">Equipment & Capabilities</h2>
            <div className="space-y-4">
              {equipmentItems.map(item => (
                <div key={item.key} className={`flex items-center justify-between gap-4 ${item.comingSoon ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  {item.comingSoon
                    ? <span className="text-[10px] font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">Coming Soon</span>
                    : <Switch checked={equipment[item.key]} onCheckedChange={() => toggle(item.key)} />}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Verification Status */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Verification Status</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Status: <span className="capitalize font-medium text-foreground">{profile.verification_status || 'pending'}</span>
            </p>
            {profile.verification_status === 'pending' && (
              <p className="text-xs text-muted-foreground">Contact support to start your identity verification process.</p>
            )}
            {profile.verification_status === 'verified' && (
              <p className="text-xs text-green-400">Your identity is verified. You may receive a verified badge.</p>
            )}
          </GlassCard>

          {/* Appearance */}
          <GlassCard className="p-5">
            <h2 className="font-semibold text-sm mb-4">Appearance</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                  <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-11 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </GlassCard>

          {/* Account */}
          <GlassCard className="p-5">
            <h2 className="font-semibold text-sm mb-4">Account</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><span className="text-foreground font-medium">Email:</span> {user?.email}</p>
              <p><span className="text-foreground font-medium">Name:</span> {user?.full_name}</p>
              <p><span className="text-foreground font-medium">Role:</span> {user?.selected_role || user?.role}</p>
            </div>
          </GlassCard>

          {/* Switch Role */}
          <GlassCard className="p-5">
            <h2 className="font-semibold text-sm mb-4">Switch Role</h2>
            <div className="space-y-2">
              {user?.selected_role !== 'user' && (
                <button onClick={() => handleSwitchRole('user')} disabled={switchingRole} className="w-full text-left disabled:opacity-50">
                  <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm flex items-center gap-3">
                    <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                    <span>{switchingRole ? 'Switching...' : 'Switch to User'}</span>
                  </div>
                </button>
              )}
              {user?.selected_role !== 'avatar' && (
                <button onClick={() => handleSwitchRole('avatar')} disabled={switchingRole} className="w-full text-left disabled:opacity-50">
                  <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm flex items-center gap-3">
                    <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                    <span>{switchingRole ? 'Switching...' : 'Switch to Avatar'}</span>
                  </div>
                </button>
              )}
              {user?.selected_role !== 'enterprise' && (
                <button onClick={() => handleSwitchRole('enterprise')} disabled={switchingRole} className="w-full text-left disabled:opacity-50">
                  <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm flex items-center gap-3">
                    <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                    <span>{switchingRole ? 'Switching...' : 'Switch to Enterprise'}</span>
                  </div>
                </button>
              )}
            </div>
          </GlassCard>

          {/* Sign Out */}
          <button onClick={() => base44.auth.logout('/Landing')} className="w-full text-left">
            <GlassCard className="p-4 flex items-center gap-3" hover>
              <LogOut className="w-5 h-5 text-red-400" />
              <span className="font-medium text-sm text-red-400">Sign out</span>
            </GlassCard>
          </button>
        </div>
      )}
    </AppShell>
  );
}