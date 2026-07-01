import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { getNavItems } from '@/lib/navItems';
import { ArrowLeft, Sun, Moon, Palette, ArrowRightLeft, LogOut, Shield, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/lib/ThemeContext';
import { PageHero } from '@/components/ui/PagePrimitives';

export default function UserSettings() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const { theme, setTheme, toggleTheme } = useTheme();
  const [switchingRole, setSwitchingRole] = useState(false);

  const handleSwitchRole = async (targetRole) => {
    if (targetRole === user?.selected_role) return;
    setSwitchingRole(true);
    await base44.auth.updateMe({ selected_role: targetRole });
    await new Promise(r => setTimeout(r, 300));
    if (targetRole === 'avatar') {
      const profiles = await base44.entities.AvatarProfile.filter({ user_email: user.email });
      navigate(profiles.length > 0 ? '/AvatarDashboard' : '/Onboarding?role=avatar');
    } else if (targetRole === 'enterprise') {
      const profiles = await base44.entities.EnterpriseProfile.filter({ user_email: user.email });
      navigate(profiles.length > 0 ? '/EnterpriseDashboard' : '/Onboarding?role=enterprise');
    } else {
      navigate('/FindPeople');
    }
    setSwitchingRole(false);
  };

  return (
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHero
          eyebrow="Account"
          title="Settings"
          description="Manage identity, appearance, role switching, and account access."
          icon={Shield}
          actions={<button onClick={() => navigate('/Profile')} className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/15"><ArrowLeft className="w-4 h-4" /> Profile</button>}
        />

        <div className="space-y-4">
          {/* Account info */}
          <GlassCard className="p-5">
            <h2 className="font-semibold text-sm mb-4">Account</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><span className="text-foreground font-medium">Email:</span> {user?.email}</p>
              <p><span className="text-foreground font-medium">Name:</span> {user?.full_name}</p>
              <p><span className="text-foreground font-medium">Role:</span> <span className="capitalize">{user?.selected_role || user?.role}</span></p>
            </div>
          </GlassCard>

          {/* Appearance */}
          <GlassCard className="p-5">
            <h2 className="font-semibold text-sm mb-4">Appearance</h2>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-muted-foreground" />
                  : theme === 'loflo' ? <Palette className="w-4 h-4 text-muted-foreground" />
                  : <Sun className="w-4 h-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium">{theme === 'dark' ? 'Dark Mode' : theme === 'loflo' ? 'Purple' : 'Light Mode'}</p>
                  <p className="text-xs text-muted-foreground">Cycle between themes</p>
                </div>
              </div>
              <button onClick={toggleTheme} className="px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-xs font-medium">
                Next ???
              </button>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'light', label: 'Light', color: '#f5f5f5', dot: '#e8304a' },
                { id: 'dark', label: 'Dark', color: '#161c26', dot: '#e8304a' },
                { id: 'loflo', label: 'Purple', color: '#1e1530', dot: '#c44dff' },
              ].map(t => (
                <button key={t.id} onClick={() => setTheme(t.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl border-2 transition-all text-xs font-medium ${theme === t.id ? 'border-primary' : 'border-border'}`}
                  style={{ background: t.color }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.dot, display: 'block' }} />
                  <span style={{ color: t.id === 'light' ? '#111' : '#fff' }}>{t.label}</span>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Switch Role */}
          <GlassCard className="p-5">
            <h2 className="font-semibold text-sm mb-4">Switch Role</h2>
            <div className="space-y-2">
              {['user', 'avatar', 'enterprise'].filter(r => r !== user?.selected_role).map(role => (
                <button key={role} onClick={() => handleSwitchRole(role)} disabled={switchingRole}
                  className="w-full p-3 rounded-lg bg-card hover:bg-muted transition-colors text-sm flex items-center gap-3 disabled:opacity-50">
                  <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                  <span className="capitalize">{switchingRole ? 'Switching...' : `Switch to ${role === 'avatar' ? 'agent' : role}`}</span>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Identity Verification */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Identity Verification</h2>
            </div>
            {user?.identity_verified ? (
              <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-400">Identity Verified ???</p>
                  <p className="text-xs text-muted-foreground">Your identity has been successfully confirmed.</p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">Verify your identity to build trust and unlock posting & applying for jobs.</p>
                <button onClick={() => navigate('/IdentityVerification')}
                  className="text-xs text-primary hover:underline">Start verification ???</button>
              </>
            )}
          </GlassCard>

          {/* Sign out */}
          <button onClick={() => base44.auth.logout('/Landing')} className="w-full text-left">
            <GlassCard className="p-4 flex items-center gap-3" hover>
              <LogOut className="w-5 h-5 text-red-400" />
              <span className="font-medium text-sm text-red-400">Sign out</span>
            </GlassCard>
          </button>
        </div>
      </div>
    </AppShell>
  );
}

