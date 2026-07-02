import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle, CreditCard, Download, FileText, Loader2, Receipt, Wallet } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AppShell from '@/components/layout/AppShell';
import GlassCard from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getNavItems } from '@/lib/navItems';
import { EmptyState, PageHero, SectionTitle } from '@/components/ui/PagePrimitives';

const MONEY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function money(value) {
  return MONEY.format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString();
}

function downloadEnterpriseInvoice(transaction, profile, user) {
  const doc = new jsPDF();
  const invoiceNo = `INV-${transaction.id.slice(-6).toUpperCase()}`;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CoTask Enterprise Invoice', 20, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoiceNo}`, 20, 38);
  doc.text(`Date: ${formatDate(transaction.date)}`, 20, 45);
  doc.text(`Company: ${profile?.company_name || 'Enterprise account'}`, 20, 52);
  doc.text(`Account owner: ${user?.full_name || user?.email || 'Owner'}`, 20, 59);
  doc.text(`Billing email: ${profile?.company_email || user?.email || 'Not set'}`, 20, 66);

  doc.line(20, 74, 190, 74);
  doc.setFont('helvetica', 'bold');
  doc.text('Task Details', 20, 86);
  doc.setFont('helvetica', 'normal');
  doc.text(`Description: ${transaction.title}`, 20, 96);
  doc.text(`Local Agent: ${transaction.agent}`, 20, 103);
  doc.text(`Status: ${transaction.status}`, 20, 110);

  doc.line(20, 120, 190, 120);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment', 20, 132);
  doc.setFont('helvetica', 'normal');
  doc.text('Amount:', 20, 142);
  doc.text(money(transaction.amount), 160, 142);
  doc.text('Currency:', 20, 149);
  doc.text(transaction.currency || 'USD', 160, 149);

  doc.setFontSize(8);
  doc.text('CoTask Platform - cotask.app - support@cotask.app', 20, 280);
  doc.save(`cotask-enterprise-${invoiceNo}.pdf`);
}

export default function EnterpriseBilling() {
  const { user, loading } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ['enterprise-billing-profile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.EnterpriseProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['enterprise-billing-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ client_email: user.email, client_type: 'enterprise' }, '-updated_date', 100),
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: (updates) => base44.entities.EnterpriseProfile.update(profile.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-billing-profile'] });
      queryClient.invalidateQueries({ queryKey: ['enterprise-profile-page'] });
      toast({ title: 'Billing settings saved' });
    },
    onError: () => toast({ title: 'Could not save billing settings', variant: 'destructive' }),
  });

  const transactions = useMemo(() => bookings
    .filter(booking => booking.total_amount || booking.amount || ['paid', 'held', 'released', 'refunded', 'failed'].includes(booking.payment_status))
    .map(booking => ({
      id: booking.id,
      title: `${booking.category || 'Enterprise'} task`,
      agent: booking.avatar_name || 'Local Agent',
      amount: booking.total_amount || booking.amount || 0,
      currency: booking.currency || 'USD',
      date: booking.released_at || booking.updated_date || booking.created_date,
      status: booking.payment_status || booking.status || 'pending',
      bookingStatus: booking.status,
    }))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)), [bookings]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const paidTransactions = transactions.filter(transaction => ['paid', 'released'].includes(transaction.status) || transaction.bookingStatus === 'completed');
  const heldTransactions = transactions.filter(transaction => transaction.status === 'held');
  const pendingTransactions = transactions.filter(transaction => ['pending', 'failed'].includes(transaction.status));
  const totalSpend = paidTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const heldAmount = heldTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const pendingAmount = pendingTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
      <div className="max-w-5xl space-y-6">
        <PageHero
          eyebrow="Enterprise billing"
          title="Billing and Invoices"
          description="Track enterprise spend, Secure Payment holds, invoice preferences, and downloadable records."
          icon={Wallet}
          actions={<Button asChild><Link to="/Bookings">Review tasks</Link></Button>}
          stats={[
            { label: 'Paid spend', value: money(totalSpend) },
            { label: 'Held securely', value: money(heldAmount) },
            { label: 'Invoices', value: transactions.length },
          ]}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard className="p-5">
            <CreditCard className="mb-3 h-5 w-5 text-green-500" />
            <p className="text-sm text-muted-foreground">Paid spend</p>
            <p className="mt-1 text-2xl font-black">{money(totalSpend)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{paidTransactions.length} completed charge{paidTransactions.length !== 1 ? 's' : ''}</p>
          </GlassCard>
          <GlassCard className="p-5">
            <AlertCircle className="mb-3 h-5 w-5 text-amber-500" />
            <p className="text-sm text-muted-foreground">Secure Payment held</p>
            <p className="mt-1 text-2xl font-black">{money(heldAmount)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{heldTransactions.length} active hold{heldTransactions.length !== 1 ? 's' : ''}</p>
          </GlassCard>
          <GlassCard className="p-5">
            <Receipt className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">Pending or failed</p>
            <p className="mt-1 text-2xl font-black">{money(pendingAmount)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{pendingTransactions.length} item{pendingTransactions.length !== 1 ? 's' : ''} to review</p>
          </GlassCard>
        </div>

        <GlassCard className="p-5">
          <SectionTitle title="Billing Settings" description="These settings are part of the enterprise profile, but shown here for quick billing updates." />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Invoice preference</label>
              <select
                value={profile?.invoice_preference || 'monthly'}
                disabled={!profile?.id || updateProfile.isPending}
                onChange={(event) => updateProfile.mutate({ invoice_preference: event.target.value })}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm disabled:opacity-60"
              >
                <option value="per_booking">Per task</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div className="rounded-lg border border-border bg-secondary/35 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Billing email</p>
              <p className="mt-1 truncate text-sm font-semibold">{profile?.company_email || user?.email || 'Not set'}</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/35 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Company profile</p>
              <Link to="/EnterpriseProfile" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                Edit profile settings
              </Link>
            </div>
          </div>
        </GlassCard>

        <SectionTitle
          title="Invoice Records"
          description="Download a PDF for any enterprise task with a payment record."
          action={<Button asChild variant="outline" size="sm"><Link to="/FindPeople">Deploy another agent</Link></Button>}
        />

        {bookingsLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(item => <GlassCard key={item} className="p-4 animate-pulse"><div className="h-4 w-1/3 rounded bg-muted" /></GlassCard>)}</div>
        ) : transactions.length === 0 ? (
          <EmptyState icon={FileText} title="No billing records yet" description="Enterprise invoices will appear after your first task has a payment record." />
        ) : (
          <div className="space-y-3">
            {transactions.map(transaction => {
              const settled = ['paid', 'released'].includes(transaction.status) || transaction.bookingStatus === 'completed';
              return (
                <GlassCard key={transaction.id} className="p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${settled ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {settled ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{transaction.title}</p>
                        <p className="text-xs text-muted-foreground">{transaction.agent} - {formatDate(transaction.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 md:justify-end">
                      <div className="text-right">
                        <p className="text-sm font-black">{money(transaction.amount)}</p>
                        <Badge variant={settled ? 'default' : transaction.status === 'failed' ? 'destructive' : 'secondary'} className="mt-1 capitalize">{transaction.status}</Badge>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => downloadEnterpriseInvoice(transaction, profile, user)}>
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        {updateProfile.isPending && (
          <div className="fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving billing settings
          </div>
        )}
      </div>
    </AppShell>
  );
}
