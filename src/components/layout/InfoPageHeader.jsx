import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PublicNav from '@/components/landing/PublicNav';

export default function InfoPageHeader() {
  const { user } = useCurrentUser();

  if (!user) return <PublicNav />;

  const dashPath =
    user.selected_role === 'avatar' ? '/AvatarDashboard' :
    user.selected_role === 'enterprise' ? '/EnterpriseDashboard' :
    '/UserDashboard';

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link to={dashPath} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <Link to="/" className="text-base font-black tracking-tight">
          Co<span className="text-primary">Task</span>
        </Link>
      </div>
    </div>
  );
}

