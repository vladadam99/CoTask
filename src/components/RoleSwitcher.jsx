import React from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { refreshUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Users, User, Building2 } from 'lucide-react';

export default function RoleSwitcher({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const switchRole = async (role) => {
    if (user?.role === role) return;
    try {
      // Update role on backend
      await base44.auth.updateMe({ role });
      // Refresh user globally and wait for all listeners to update
      const updated = await refreshUser();
      // Invalidate queries after user is refreshed
      queryClient.invalidateQueries();
      // Navigate based on updated role
      if (updated.role === 'avatar') {
        const profiles = await base44.entities.AvatarProfile.filter({ user_email: updated.email });
        navigate(profiles.length > 0 ? '/AvatarDashboard' : '/Onboarding?role=avatar');
      } else if (updated.role === 'enterprise') {
        const profiles = await base44.entities.EnterpriseProfile.filter({ user_email: updated.email });
        navigate(profiles.length > 0 ? '/EnterpriseDashboard' : '/Onboarding?role=enterprise');
      } else {
        navigate('/UserDashboard');
      }
      } catch (err) {
      console.error('Failed to switch role:', err);
      }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase">Switch Role</p>
      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          variant={user?.role === 'user' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => switchRole('user')}
        >
          <User className="w-4 h-4 mr-2" /> Client
        </Button>
        <Button
          size="sm"
          variant={user?.role === 'avatar' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => switchRole('avatar')}
        >
          <Users className="w-4 h-4 mr-2" /> Avatar
        </Button>
        <Button
          size="sm"
          variant={user?.role === 'enterprise' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => switchRole('enterprise')}
        >
          <Building2 className="w-4 h-4 mr-2" /> Enterprise
        </Button>
      </div>
    </div>
  );
}