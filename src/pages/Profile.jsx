import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, MoreVertical, Star, MapPin, Upload, Loader2,
  Briefcase, X, Pencil, FileText,
  DollarSign, TrendingUp, Wallet, Clock, ArrowUpRight, Download, CheckCircle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AppShell from '@/components/layout/AppShell';
import { getNavItems } from '@/lib/navItems';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { jsPDF } from 'jspdf';
import GlassCard from '@/components/ui/GlassCard';

const PLATFORM_FEE_RATE = 0.1;

function downloadInvoice(job, userEmail, userName) {
  const doc = new jsPDF();
  const gross = job.escrow_amount || job.budget_max || 0;
  const fee = gross * PLATFORM_FEE_RATE;
  const net = gross - fee;
  const date = job.ended_at ? new Date(job.ended_at).toLocaleDateString() : new Date(job.updated_date).toLocaleDateString();
  const invoiceNo = `INV-${job.id.slice(-6).toUpperCase()}`;
  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('CoTask Invoice', 20, 25);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoiceNo}`, 20, 38);
  doc.text(`Date: ${date}`, 20, 45);
  doc.text(`Name: ${userName}`, 20, 52);
  doc.text(`Email: ${userEmail}`, 20, 59);
  doc.line(20, 65, 190, 65);
  doc.setFont('helvetica', 'bold'); doc.text('Task Details', 20, 75);
  doc.setFont('helvetica', 'normal');
  doc.text(`Title: ${job.title}`, 20, 85);
  doc.text(`Category: ${job.category || '-'}`, 20, 92);
  doc.text(`Client: ${job.posted_by_name}`, 20, 99);
  doc.line(20, 107, 190, 107);
  doc.setFont('helvetica', 'bold'); doc.text('Payment Breakdown', 20, 117);
  doc.setFont('helvetica', 'normal');
  doc.text('Gross Amount:', 20, 127); doc.text(`$${gross.toFixed(2)}`, 160, 127);
  doc.text('Platform Fee (10%):', 20, 134); doc.text(`-$${fee.toFixed(2)}`, 160, 134);
  doc.setFont('helvetica', 'bold');
  doc.text('Net Earned:', 20, 145); doc.text(`$${net.toFixed(2)}`, 160, 145);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text('CoTask Platform · cotask.app · support@cotask.app', 20, 280);
  doc.save(`cotask-invoice-${invoiceNo}.pdf`);
}

const EarningsTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-panel rounded-lg px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="text-primary font-semibold">${payload[0].value.toFixed(2)}</p>
    </div>
  );
};

const BASE_TABS = ['Tasks Posted', 'Reviews', 'About'];
const AVATAR_TABS = ['Tasks Posted', 'Reviews', 'Earnings', 'About'];

export default function Profile() {
  const { user, updateUser } = useCurrentUser();
  const navigate = useNavigate();
  const isAvatar = user?.selected_role === 'avatar';
  const TABS = isAvatar ? AVATAR_TABS : BASE_TABS;
  const [activeTab, setActiveTab] = useState('Tasks Posted');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank_transfer');
  const [withdrawDone, setWithdrawDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(() => user?.profile_picture_url || '');
  const [coverUrl, setCoverUrl] = useState(() => user?.cover_picture_url || '');
  const [avatarProfile, setAvatarProfile] = useState(null);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const cvInputRef = useRef(null);

  useEffect(() => {
    if (user?.profile_picture_url) setProfilePicUrl(user.profile_picture_url);
    if (user?.cover_picture_url) setCoverUrl(user.cover_picture_url);
  }, [user?.profile_picture_url, user?.cover_picture_url]);

  useEffect(() => {
    if (user?.email) {
      base44.entities.AvatarProfile.filter({ user_email: user.email }).then(r => setAvatarProfile(r[0] || null));
    }
  }, [user?.email]);

  const { data: jobPosts = [] } = useQuery({
    queryKey: ['my-job-posts', user?.email],
    queryFn: () => base44.entities.JobPost.filter({ posted_by_email: user.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['my-reviews', user?.email],
    queryFn: () => base44.entities.Review.filter({ reviewed_email: user.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const { data: completedJobs = [] } = useQuery({
    queryKey: ['avatar-wallet-jobs', user?.email],
    queryFn: () => base44.entities.JobPost.filter({ winner_email: user.email }, '-updated_date', 100),
    enabled: !!user?.email && isAvatar,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['avatar-earnings-bookings', user?.email],
    queryFn: () => base44.entities.Booking.filter({ avatar_email: user.email, status: 'completed' }, '-created_date', 100),
    enabled: !!user?.email && isAvatar,
  });

  const walletStats = useMemo(() => {
    const done = completedJobs.filter(j => j.status === 'completed');
    const pending = completedJobs.filter(j => ['in_progress', 'awaiting_approval'].includes(j.status));
    const totalGross = done.reduce((s, j) => s + (j.escrow_amount || j.budget_max || 0), 0);
    const totalNet = totalGross * (1 - PLATFORM_FEE_RATE);
    const pendingAmount = pending.reduce((s, j) => s + (j.escrow_amount || j.budget_max || 0), 0);

    const now = new Date();
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i);
      const amount = bookings
        .filter(b => isWithinInterval(new Date(b.created_date), { start: startOfMonth(d), end: endOfMonth(d) }))
        .reduce((s, b) => s + (b.amount || 0), 0);
      return { month: format(d, 'MMM'), amount };
    });

    return { done, pending, totalGross, totalNet, pendingAmount, monthlyData };
  }, [completedJobs, bookings]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const handleProfilePictureUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ profile_picture_url: file_url });
    setProfilePicUrl(file_url);
    if (avatarProfile?.id) {
      await base44.entities.AvatarProfile.update(avatarProfile.id, { photo_url: file_url });
    }
    setUploading(false);
  };

  const handleCoverUpload = async (file) => {
    if (!file) return;
    setUploadingCover(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await updateUser({ cover_picture_url: file_url });
    setCoverUrl(file_url);
    if (avatarProfile?.id) {
      await base44.entities.AvatarProfile.update(avatarProfile.id, { cover_url: file_url });
    }
    setUploadingCover(false);
  };

  const dashPath = user?.selected_role === 'avatar' ? '/AvatarDashboard'
    : user?.selected_role === 'enterprise' ? '/EnterpriseDashboard'
    : '/FindPeople';

  const editPath = user?.selected_role === 'avatar' ? '/AvatarProfileEdit'
    : user?.selected_role === 'enterprise' ? '/EnterpriseProfile'
    : '/UserProfileEdit';

  return (
    <AppShell navItems={getNavItems(user?.selected_role || user?.role || 'user')} user={user}>
      <div className="mx-auto max-w-5xl space-y-4">

        {/* Top bar */}
        <div className="surface-panel sticky top-16 z-20 flex items-center justify-between rounded-lg px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(dashPath)} className="p-1.5 rounded-lg hover:bg-secondary">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-base">{user?.display_name || user?.full_name || 'Profile'}</span>
          </div>
          <div className="relative">
            <button onClick={() => setMenuOpen(v => !v)} className="p-2 rounded-lg hover:bg-secondary">
              <MoreVertical className="w-5 h-5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
                  <Link to={editPath} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/60 transition-colors">
                    <Pencil className="w-4 h-4 text-muted-foreground" /> Edit Profile
                  </Link>
                  <button onClick={() => { fileInputRef.current?.click(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/60 transition-colors">
                    <Upload className="w-4 h-4 text-muted-foreground" /> Change Photo
                  </button>
                  <button onClick={() => { coverInputRef.current?.click(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/60 transition-colors">
                    <Upload className="w-4 h-4 text-muted-foreground" /> Change Cover
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="surface-panel overflow-hidden rounded-lg">
        {/* Cover + Avatar */}
        <div className="relative">
          <div className="w-full h-40 bg-gradient-to-br from-primary/30 to-primary/5 overflow-hidden">
            {coverUrl
              ? <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
              : <div className="w-full h-full" />}
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} />
          </div>
          <div className="absolute -bottom-10 left-4">
            <div className="relative w-20 h-20 rounded-full border-4 border-background bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary overflow-hidden">
              {profilePicUrl
                ? <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                : (user?.full_name?.[0] || 'U')}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleProfilePictureUpload(f); }} />
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Name / role */}
        <div className="pt-14 px-4 pb-4 border-b border-border">
          <h1 className="text-xl font-bold">{user?.display_name || user?.full_name || 'User'}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className="bg-primary/10 text-primary border-primary/20 capitalize text-xs">
              {user?.selected_role || user?.role || 'user'}
            </Badge>
            {(avatarProfile?.city || user?.city) && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />{avatarProfile?.city || user?.city}
              </span>
            )}
            {avgRating && (
              <span className="flex items-center gap-1 text-xs text-yellow-400">
                <Star className="w-3 h-3 fill-yellow-400" /> {avgRating} ({reviews.length})
              </span>
            )}
          </div>
        </div>
        </div>

        <div className="surface-panel overflow-hidden rounded-lg">
        {/* Tabs */}
        <div className="flex border-b border-border bg-card/70">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="px-4 py-4">

          {/* Tasks Posted Tab */}
          {activeTab === 'Tasks Posted' && (
            <div className="space-y-3">
              {jobPosts.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Briefcase className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="font-semibold">No tasks posted yet</p>
                  <Link to="/PostJob">
                    <Button size="sm" className="mt-2">Post Open Task</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground font-medium mb-2">{jobPosts.length} Tasks</p>
                  {jobPosts.map(job => (
                    <Link key={job.id} to={`/JobDetail?id=${job.id}`}>
                      <div className="record-card mb-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-sm leading-tight flex-1">{job.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                            job.status === 'open' ? 'bg-green-500/10 text-green-400'
                            : job.status === 'completed' ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-muted text-muted-foreground'
                          }`}>{job.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{job.category}</span>
                          {(job.budget_min || job.budget_max) && (
                            <span className="font-semibold text-primary">
                              ${job.budget_min || 0}{job.budget_max ? ` – $${job.budget_max}` : '+'}
                            </span>
                          )}
                        </div>
                        {job.application_count > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">{job.application_count} application{job.application_count !== 1 ? 's' : ''}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'Reviews' && (
            <div>
              {reviews.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <Star className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="font-semibold">No reviews yet</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="text-center py-6 border-b border-border mb-4">
                    <p className="text-6xl font-bold">{avgRating}</p>
                    <div className="flex items-center justify-center gap-0.5 my-2">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-sm">({reviews.length} reviews)</p>
                  </div>

                  {/* Individual reviews */}
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="border-b border-border pb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                            {review.reviewer_name?.[0] || 'R'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold">{review.reviewer_name || 'Anonymous'}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(review.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 my-1">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                              ))}
                            </div>
                            {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Earnings Tab */}
          {activeTab === 'Earnings' && (
            <div>
              {/* Withdraw Modal */}
              {showWithdraw && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="surface-panel rounded-lg p-6 w-full max-w-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold">Withdraw Funds</h2>
                      <button onClick={() => { setShowWithdraw(false); setWithdrawDone(false); }} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                    </div>
                    {withdrawDone ? (
                      <div className="text-center py-6">
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <p className="font-semibold">Withdrawal Requested!</p>
                        <p className="text-sm text-muted-foreground mt-1">Your request is being processed (1-3 business days).</p>
                        <button onClick={() => { setShowWithdraw(false); setWithdrawDone(false); setWithdrawAmount(''); }} className="mt-4 w-full bg-primary text-primary-foreground rounded-xl py-2 text-sm font-medium">Close</button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground mb-4">Available: <span className="text-green-400 font-bold">${walletStats.totalNet.toFixed(2)}</span></p>
                        <label className="text-xs text-muted-foreground mb-1 block">Amount (USD)</label>
                        <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="0.00" className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm mb-3 outline-none" />
                        <label className="text-xs text-muted-foreground mb-1 block">Payout Method</label>
                        <select value={withdrawMethod} onChange={e => setWithdrawMethod(e.target.value)} className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm mb-4 outline-none">
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="paypal">PayPal</option>
                          <option value="wise">Wise</option>
                        </select>
                        <button
                          disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > walletStats.totalNet}
                          onClick={() => setWithdrawDone(true)}
                          className="w-full bg-primary text-primary-foreground rounded-xl py-2 text-sm font-medium disabled:opacity-40">
                          Request Withdrawal
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Balance Cards */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" /> Earnings</h2>
                <button onClick={() => setShowWithdraw(true)} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-primary/90 transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <GlassCard className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-muted-foreground">Available</span>
                  </div>
                  <p className="text-xl font-bold text-green-400">${walletStats.totalNet.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">After 10% platform fee</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">Pending</span>
                  </div>
                  <p className="text-xl font-bold text-yellow-400">${walletStats.pendingAmount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{walletStats.pending.length} job{walletStats.pending.length !== 1 ? 's' : ''} in progress</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Total Gross</span>
                  </div>
                  <p className="text-xl font-bold text-primary">${walletStats.totalGross.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{walletStats.done.length} completed task{walletStats.done.length !== 1 ? 's' : ''}</p>
                </GlassCard>
              </div>

              {/* Earnings Chart */}
              <GlassCard className="p-4 mb-6">
                <h3 className="text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Monthly Earnings (Last 6 Months)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={walletStats.monthlyData}>
                    <defs>
                      <linearGradient id="profileEarningsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(355 80% 48%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(355 80% 48%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(220 10% 55%)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(220 10% 55%)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip content={<EarningsTooltip />} />
                    <Area type="monotone" dataKey="amount" stroke="hsl(355 80% 48%)" strokeWidth={2} fill="url(#profileEarningsGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </GlassCard>

              {/* Payment History */}
              <h3 className="text-sm font-semibold mb-3">Payment History</h3>
              {walletStats.done.length === 0 ? (
                <GlassCard className="p-8 text-center">
                  <Wallet className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No completed tasks yet</p>
                </GlassCard>
              ) : (
                <div className="space-y-2">
                  {walletStats.done.map(job => {
                    const gross = job.escrow_amount || job.budget_max || 0;
                    const fee = gross * PLATFORM_FEE_RATE;
                    const net = gross - fee;
                    return (
                      <GlassCard key={job.id} className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{job.title}</p>
                              <p className="text-xs text-muted-foreground">{job.posted_by_name} · {job.ended_at ? new Date(job.ended_at).toLocaleDateString() : new Date(job.updated_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-green-400 text-sm">+${net.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Gross: ${gross.toFixed(2)}</p>
                            <button onClick={() => downloadInvoice(job, user.email, user.full_name)} className="flex items-center gap-1 text-xs text-primary hover:underline ml-auto mt-0.5">
                              <Download className="w-3 h-3" /> Invoice
                            </button>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'About' && (
            <div>
              {/* Large profile photo */}
              <div className="flex justify-center mb-6">
                <div className="w-40 h-40 rounded-full border-4 border-border bg-primary/20 flex items-center justify-center text-5xl font-bold text-primary overflow-hidden">
                  {profilePicUrl
                    ? <img src={profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                    : (user?.full_name?.[0] || 'U')}
                </div>
              </div>

              <h2 className="text-xl font-bold mb-3">{user?.display_name || user?.full_name}</h2>

              {/* Bio */}
              {(user?.selected_role === 'avatar' ? avatarProfile?.bio : user?.bio) ? (
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 whitespace-pre-line">
                  {user?.selected_role === 'avatar' ? avatarProfile?.bio : user?.bio}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mb-5 italic">No bio yet.</p>
              )}

              {/* Details */}
              <div className="space-y-3">
                {(user?.selected_role === 'avatar' ? (avatarProfile?.city || user?.city) : user?.city) && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span>
                      {user?.selected_role === 'avatar'
                        ? `${avatarProfile?.city || user?.city}${avatarProfile?.country ? `, ${avatarProfile.country}` : ''}`
                        : user?.city}
                    </span>
                  </div>
                )}
                {user?.selected_role === 'avatar' && avatarProfile?.languages?.length > 0 && (
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs mb-1.5">Languages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {avatarProfile.languages.map(l => (
                        <span key={l} className="px-2.5 py-1 rounded-full bg-secondary/60 border border-border text-xs">{l}</span>
                      ))}
                    </div>
                  </div>
                )}
                {user?.selected_role === 'avatar' && avatarProfile?.skills?.length > 0 && (
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs mb-1.5">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {avatarProfile.skills.map(s => (
                        <span key={s} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {user?.selected_role === 'avatar' && avatarProfile?.categories?.length > 0 && (
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs mb-1.5">Services</p>
                    <div className="flex flex-wrap gap-1.5">
                      {avatarProfile.categories.map(c => (
                        <span key={c} className="px-2.5 py-1 rounded-full bg-secondary/60 border border-border text-xs">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {user?.selected_role === 'avatar' && avatarProfile?.cv_url && (
                  <a href={avatarProfile.cv_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <FileText className="w-4 h-4" /> View CV
                  </a>
                )}
              </div>

              <Link to={editPath}>
                <Button variant="outline" className="w-full mt-6 border-border">
                  <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                </Button>
              </Link>
            </div>
          )}

        </div>
        </div>
      </div>
    </AppShell>
  );
}
