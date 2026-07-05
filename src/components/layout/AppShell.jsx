import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, X, HelpCircle, Settings, User, ChevronRight, Wallet, Calendar, Shield, CreditCard, DollarSign, LayoutDashboard, Users, FileText, Flag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import NotificationBell from '@/components/notifications/NotificationBell';
import RoleSwitcher from '@/components/RoleSwitcher';

const MSG_TYPES = ['message'];
const BOOKING_TYPES = ['booking_accepted', 'booking_declined'];
const JOB_TYPES = ['booking_request'];

function getNavBadgeCount(path, unreadNotifs) {
  return unreadNotifs.filter(n => {
    if (path.includes('Messages')) return MSG_TYPES.includes(n.type);
    if (path.includes('Bookings') || path.includes('AvatarRequests')) return BOOKING_TYPES.includes(n.type);
    if (path.includes('JobMarketplace')) return JOB_TYPES.includes(n.type);
    return false;
  }).length;
}

function ProfilePanel({ user, onClose, navItems = [], roleOverride }) {
  const activeRole = roleOverride || (user?.role === 'admin' ? 'admin' : (user?.selected_role || user?.role || 'user'));
  let menuItems = [];

  if (activeRole === 'admin') {
    menuItems = [
      { icon: LayoutDashboard, label: 'Admin Dashboard', path: '/AdminDashboard' },
      { icon: Users, label: 'Users', path: '/AdminDashboard' },
      { icon: Calendar, label: 'Tasks', path: '/AdminDashboard' },
      { icon: DollarSign, label: 'Payments / Secure Payment', path: '/AdminDashboard' },
      { icon: Flag, label: 'Disputes', path: '/AdminDashboard' },
      { icon: Shield, label: 'Verification / Safety', path: '/AdminDashboard' },
      { icon: Settings, label: 'Settings', path: '/AdminDashboard' },
    ];
  } else if (activeRole === 'enterprise') {
    menuItems = [
      { icon: LayoutDashboard, label: 'Enterprise Dashboard', path: '/EnterpriseDashboard' },
      { icon: Users, label: 'Company Profile / Settings', path: '/EnterpriseProfile' },
      { icon: FileText, label: 'Team Workspace', path: '/EnterpriseTeam' },
      { icon: DollarSign, label: 'Billing / Invoices', path: '/EnterpriseBilling' },
      { icon: HelpCircle, label: 'Help & FAQ', path: '/FAQ' },
    ];
  } else if (activeRole === 'avatar') {
    menuItems = [
      { icon: User, label: 'Public Profile', path: '/AvatarProfileEdit' },
      { icon: Shield, label: 'Verification', path: '/IdentityVerification' },
      { icon: Wallet, label: 'Earnings', path: '/AvatarWallet' },
      { icon: DollarSign, label: 'Payout Settings', path: '/AvatarWallet?payout=settings' },
      { icon: Settings, label: 'Settings', path: '/AvatarSettings' },
      { icon: HelpCircle, label: 'Help & FAQ', path: '/FAQ' },
    ];
  } else {
    menuItems = [
      { icon: Calendar, label: 'Workboard', path: '/Bookings' },
      { icon: CreditCard, label: 'Billing / Payments', path: '/UserWallet' },
      { icon: Settings, label: 'Settings', path: '/UserSettings' },
      { icon: HelpCircle, label: 'Help & FAQ', path: '/FAQ' },
    ];
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border bg-card/95 backdrop-blur-xl flex-shrink-0">
        <h1 className="text-lg font-bold">Profile</h1>
        <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {/* User card */}
        <Link to={activeRole === 'avatar' ? '/AvatarProfileEdit' : activeRole === 'enterprise' ? '/EnterpriseProfile' : '/UserProfile'} onClick={onClose} className="mx-4 mt-4 mb-3 p-4 rounded-lg bg-card border border-border shadow-sm flex items-center gap-3 hover:border-primary/30 hover:shadow-md transition-all">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
            {user?.full_name?.[0] || 'U'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-base truncate">{user?.full_name || 'User'}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
        </Link>

        {/* Role switcher */}
        {user && (
          <div className="mx-4 mb-4">
            <RoleSwitcher user={user} />
          </div>
        )}

        {/* Menu items */}
        <div className="mx-4 rounded-lg bg-card border border-border shadow-sm overflow-hidden mb-4">
          {menuItems.map((item, idx) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3.5 hover:bg-secondary transition-colors text-sm ${
                idx !== menuItems.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <item.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <span className="flex-1 font-medium">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
        </div>

        {/* Sign out */}
        <div className="mx-4 mb-8">
          <button
            onClick={() => base44.auth.logout('/Landing')}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-lg bg-card border border-border shadow-sm hover:bg-destructive/10 transition-colors text-sm text-destructive"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">Sign out</span>
          </button>
        </div>
      </div>

      {/* Bottom nav inside profile panel */}
      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-lg border border-border/80 bg-card/95 backdrop-blur-2xl shadow-[0_18px_55px_hsl(222_47%_11%/0.18)]">
        <div className="flex items-center justify-around gap-1 p-1.5">
        {navItems.slice(0, 5).map(item => (
          <Link key={item.path} to={item.path} onClick={onClose}
            className="relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-muted-foreground transition-all hover:bg-secondary/75 hover:text-foreground">
            <item.icon className="h-5 w-5" />
            <span className="max-w-full truncate text-[10px] font-bold">{item.label}</span>
          </Link>
        ))}
        <button
          className="relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg bg-primary px-2 py-2 text-primary-foreground shadow-sm transition-all"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-black text-primary-foreground">
            {user?.full_name?.[0] || 'U'}
          </div>
          <span className="text-[10px] font-bold">Profile</span>
        </button>
        </div>
      </nav>
    </div>
  );
}

export default function AppShell({ children, navItems = [], user, fullBleed = false, title, roleOverride, homePathOverride }) {
  const [unreadNotifs, setUnreadNotifs] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      try {
        const list = await base44.entities.Notification.filter({ user_email: user.email, is_read: false }, '-created_date', 100);
        const activeRole = roleOverride || user.selected_role || user.role || 'user';
        setUnreadNotifs(list.filter(n => !n.target_role || n.target_role === activeRole));
      } catch (e) {}
    };
    load();
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email === user.email) {
        const activeRole = roleOverride || user.selected_role || user.role || 'user';
        if (event.type === 'create' && (!event.data?.target_role || event.data?.target_role === activeRole) && !event.data?.is_read) {
          setUnreadNotifs(prev => [event.data, ...prev]);
        } else if (event.type === 'update') {
          setUnreadNotifs(prev => event.data?.is_read ? prev.filter(n => n.id !== event.id) : prev.map(n => n.id === event.id ? event.data : n));
        } else if (event.type === 'delete') {
          setUnreadNotifs(prev => prev.filter(n => n.id !== event.id));
        }
      }
    });
    return unsub;
  }, [user?.email, user?.selected_role, user?.role, roleOverride]);

  const activeRole = roleOverride || user?.selected_role || user?.role || 'user';
  const computedHomePath = activeRole === 'avatar' ? '/AvatarDashboard' : activeRole === 'enterprise' ? '/EnterpriseDashboard' : activeRole === 'admin' ? '/AdminDashboard' : '/Explore';
  const homePath = homePathOverride || computedHomePath;
  const settingsPath = activeRole === 'avatar' ? '/AvatarSettings' : activeRole === 'enterprise' ? '/EnterpriseProfile' : '/UserSettings';

  return (
    <div className="min-h-screen flex overflow-x-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border fixed inset-y-0 left-0 z-40">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <Link to={homePath} className="text-xl font-extrabold tracking-tight flex-1 py-3 px-2 rounded-lg hover:bg-secondary transition-colors">
            Co<span className="text-primary">Task</span>
          </Link>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border space-y-3 bg-secondary/35">
          <div className="hidden lg:flex justify-end mb-2">
            <NotificationBell userEmail={user?.email} userRole={activeRole} />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              {user?.full_name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{activeRole === 'avatar' ? 'Local Agent' : activeRole}</p>
            </div>
          </div>
          {user && <RoleSwitcher user={user} />}
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => base44.auth.logout('/Landing')}>
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card/95 backdrop-blur-xl border-b border-border flex items-center justify-between px-4">
        {(() => {
          if (title) return <span className="text-lg font-bold">{title}</span>;
          const currentNav = navItems.find(item => item.path === location.pathname);
          if (currentNav) {
            return <span className="text-lg font-bold">{currentNav.label}</span>;
          }
          return <Link to={homePath} className="text-lg font-bold">Co<span className="text-primary">Task</span></Link>;
        })()}
        <NotificationBell userEmail={user?.email} userRole={activeRole} />
      </div>

      {/* Profile Panel (full screen) */}
      {profileOpen && <ProfilePanel user={user} onClose={() => setProfileOpen(false)} navItems={navItems} roleOverride={roleOverride} />}

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed inset-x-3 bottom-3 z-50 rounded-lg border border-border/80 bg-card/95 backdrop-blur-2xl shadow-[0_18px_55px_hsl(222_47%_11%/0.18)]">
        <div className="flex items-center justify-around gap-1 p-1.5">
        {navItems.slice(0, 5).map(item => {
          const isActive = location.pathname === item.path;
          const badgeCount = getNavBadgeCount(item.path, unreadNotifs);
          const handleNavClick = async () => {
            if (badgeCount > 0) {
              const toMark = unreadNotifs.filter(n => {
                if (item.path.includes('Messages')) return MSG_TYPES.includes(n.type);
                if (item.path.includes('Bookings') || item.path.includes('AvatarRequests')) return BOOKING_TYPES.includes(n.type);
                if (item.path.includes('JobMarketplace')) return JOB_TYPES.includes(n.type);
                return false;
              });
              setUnreadNotifs(prev => prev.filter(n => !toMark.find(m => m.id === n.id)));
              toMark.forEach(n => base44.entities.Notification.update(n.id, { is_read: true }));
            }
          };
          return (
            <Link key={item.path} to={item.path} onClick={handleNavClick}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 transition-all ${
                isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/75 hover:text-foreground'
              }`}>
              <item.icon className="h-5 w-5" />
              {badgeCount > 0 && (
                <span className={`absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black ${
                  isActive ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'
                }`}>
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
              <span className="max-w-full truncate text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}

        {/* Profile tab */}
        <button
          onClick={() => setProfileOpen(true)}
          className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 transition-all ${
            profileOpen ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary/75 hover:text-foreground'
          }`}
        >
          <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
            profileOpen ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/15 text-primary'
          }`}>
            {user?.full_name?.[0] || 'U'}
          </div>
          <span className="text-[10px] font-bold">Profile</span>
        </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`flex-1 min-w-0 lg:ml-64 ${fullBleed ? '' : 'overflow-x-hidden pt-14 lg:pt-0 pb-28 lg:pb-0'}`}>
        {fullBleed ? children : (
          <div className="page-shell">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}

