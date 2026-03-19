import React from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Users, User, Building2 } from 'lucide-react';

export default function RoleSwitcher({ user }) {
  const navigate = useNavigate();

  const switchRole = async (role) => {
    if (user?.role === role) return;
    try {
      await base44.auth.updateMe({ role });
      const dashboards = {
        user: '/UserDashboard',
        avatar: '/AvatarDashboard',
        enterprise: '/EnterpriseDashboard',
      };
      navigate(dashboards[role] || '/UserDashboard');
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