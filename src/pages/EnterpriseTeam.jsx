import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Calendar, ExternalLink, Mail, ShieldCheck, UserRound, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getNavItems } from '@/lib/navItems';
import { EmptyState, PageHero, SectionTitle } from '@/components/ui/PagePrimitives';

function formatDate(value) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString();
}

export default function EnterpriseTeam() {
  const { user, loading } = useCurrentUser();

  const { data: profile } = useQuery({
    queryKey: ['enterprise-team-profile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.EnterpriseProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['enterprise-team-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ client_email: user.email, client_type: 'enterprise' }, '-updated_date', 100),
    enabled: !!user,
  });

  const agentRows = useMemo(() => {
    const rows = new Map();
    bookings.forEach((booking) => {
      if (!booking.avatar_email) return;
      const existing = rows.get(booking.avatar_email) || {
        email: booking.avatar_email,
        name: booking.avatar_name || 'Local Agent',
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        totalSpend: 0,
        lastDate: booking.updated_date || booking.created_date,
      };
      existing.totalTasks += 1;
      if (['accepted', 'scheduled', 'in_progress', 'live'].includes(booking.status)) existing.activeTasks += 1;
      if (booking.status === 'completed' || ['paid', 'released'].includes(booking.payment_status)) {
        existing.completedTasks += 1;
        existing.totalSpend += booking.total_amount || booking.amount || 0;
      }
      const bookingDate = booking.updated_date || booking.created_date;
      if (bookingDate && (!existing.lastDate || new Date(bookingDate) > new Date(existing.lastDate))) {
        existing.lastDate = bookingDate;
      }
      rows.set(booking.avatar_email, existing);
    });
    return Array.from(rows.values()).sort((a, b) => b.activeTasks - a.activeTasks || new Date(b.lastDate || 0) - new Date(a.lastDate || 0));
  }, [bookings]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const activeTasks = bookings.filter(booking => ['accepted', 'scheduled', 'in_progress', 'live'].includes(booking.status)).length;

  return (
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
      <div className="max-w-5xl space-y-6">
        <PageHero
          eyebrow="Enterprise team"
          title="Team Workspace"
          description="See the company owner, profile status, and the Local Agents your enterprise has worked with."
          icon={Users}
          actions={<Button asChild><Link to="/FindPeople">Deploy agent</Link></Button>}
          stats={[
            { label: 'Workspace owner', value: user?.full_name || 'Owner' },
            { label: 'Local Agents', value: agentRows.length },
            { label: 'Active tasks', value: activeTasks },
          ]}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard className="p-5">
            <UserRound className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Account owner</p>
            <p className="mt-1 text-sm text-foreground">{user?.full_name || 'Enterprise owner'}</p>
            <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
          </GlassCard>
          <GlassCard className="p-5">
            <Building2 className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Company profile</p>
            <p className="mt-1 text-sm text-foreground">{profile?.company_name || 'Not set'}</p>
            <Link to="/EnterpriseProfile" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Open profile <ExternalLink className="h-3 w-3" />
            </Link>
          </GlassCard>
          <GlassCard className="p-5">
            <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Workspace access</p>
            <p className="mt-1 text-xs text-muted-foreground">Internal teammate access is reviewed through support while company roles are finalized.</p>
            <Link to="/Contact" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Request teammate access <Mail className="h-3 w-3" />
            </Link>
          </GlassCard>
        </div>

        <SectionTitle
          title="Local Agent Network"
          description="Agents appear here after enterprise bookings, so team activity reflects real work instead of placeholder records."
          action={<Button asChild variant="outline" size="sm"><Link to="/Bookings">View tasks</Link></Button>}
        />

        {bookingsLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(item => <GlassCard key={item} className="p-4 animate-pulse"><div className="h-4 w-1/3 rounded bg-muted" /></GlassCard>)}</div>
        ) : agentRows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No agent activity yet"
            description="Deploy your first Local Agent and this page will become your enterprise team history."
            action={<Button asChild><Link to="/FindPeople">Find Local Agents</Link></Button>}
          />
        ) : (
          <div className="space-y-3">
            {agentRows.map(agent => (
              <GlassCard key={agent.email} className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-sm font-black text-primary">
                      {agent.name?.[0] || 'A'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <Badge variant="outline">{agent.totalTasks} task{agent.totalTasks !== 1 ? 's' : ''}</Badge>
                    <Badge variant={agent.activeTasks ? 'default' : 'secondary'}>{agent.activeTasks} active</Badge>
                    <Badge variant="secondary">{agent.completedTasks} complete</Badge>
                    <Badge variant="outline">${agent.totalSpend.toFixed(0)} spent</Badge>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Last activity: {formatDate(agent.lastDate)}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
