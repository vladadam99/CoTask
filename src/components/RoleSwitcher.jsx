import React from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { refreshUser } from '@/lib/useCurrentUser';
import { Users, User, Building2 } from 'lucide-react';

export default function RoleSwitcher({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const switchRole = async (role) => {
    if (user?.selected_role === role) return;
    try {
      await base44.auth.updateMe({ selected_role: role });
      await refreshUser();
      queryClient.invalidateQueries();
      if (role === 'avatar') {
        const profiles = await base44.entities.AvatarProfile.filter({ user_email: user.email });
        navigate(profiles.length > 0 ? '/AvatarDashboard' : '/Onboarding?role=avatar');
      } else if (role === 'enterprise') {
        const profiles = await base44.entities.EnterpriseProfile.filter({ user_email: user.email });
        navigate(profiles.length > 0 ? '/EnterpriseDashboard' : '/Onboarding?role=enterprise');
      } else {
        navigate('/UserDashboard');
      }
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  const roles = [
    { key: 'user', label: 'Client', icon: User },
    { key: 'avatar', label: 'Agent', icon: Users },
    { key: 'enterprise', label: 'Team', icon: Building2 },
  ];

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Role</p>
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-secondary/70 p-1">
        {roles.map((role) => {
          const Icon = role.icon;
          const active = user?.selected_role === role.key;
          return (
            <button
              key={role.key}
              type="button"
              onClick={() => switchRole(role.key)}
              className={`flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-card/70 hover:text-foreground'
              }`}
              title={role.key === 'avatar' ? 'Local Agent' : role.label}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{role.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
