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
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-background/80 backdrop-blur border-b border-border">
      <Link to={dashPath} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
    </div>
  );
}