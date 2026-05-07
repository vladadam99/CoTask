import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, X, HelpCircle, Settings, User, ChevronRight, Wallet, Calendar } from 'lucide-react';
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

function ProfilePanel({ user, onClose }) {
  const settingsPath = user?.selected_role === 'avatar' ? '/AvatarSettings' : user?.selected_role === 'enterprise' ? '/EnterpriseSettings' : '/Profile';
  const bookingsPath = user?.selected_role === 'avatar' ? '/AvatarRequests' : '/Bookings';
  const walletPath = user?.selected_role === 'avatar' ? '/AvatarWallet' : '/UserWallet';

  const menuItems = [
    { icon: Settings, label: 'Settings', path: settingsPath },
    { icon: Wallet, label: 'Wallet', path: walletPath },
    { icon: Calendar, label: 'Bookings', path: bookingsPath },
    { icon: HelpCircle, label: 'Help & FAQ', path: '/FAQ' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-white/5 flex-shrink-0">
        <h1 className="text-lg font-bold">Profile</h1>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* User card */}
        <Link to="/Profile" onClick={onClose} className="mx-4 mt-4 mb-2 p-4 rounded-2xl bg-card border border-white/5 flex items-center gap-3 hover:bg-white/5 transition-colors">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
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
        <div className="mx-4 rounded-2xl bg-card border border-white/5 overflow-hidden mb-4">
          {menuItems.map((item, idx) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-4 hover:bg-white/5 transition-colors text-sm ${
                idx !== menuItems.length - 1 ? 'border-b border-white/5' : ''
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
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-card border border-white/5 hover:bg-white/5 transition-colors text-sm text-destructive"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children, navItems = [], user, fullBleed = false }) {
  const [unreadNotifs, setUnreadNotifs] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      try {
        const list = await base44.entities.Notification.filter({ user_email: user.email, is_read: false }, '-created_date', 100);
        setUnreadNotifs(list.filter(n => n.target_role === user.selected_role));
      } catch (e) {}
    };
    load();
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email === user.email) {
        if (event.type === 'create' && event.data?.target_role === user.selected_role && !event.data?.is_read) {
          setUnreadNotifs(prev => [event.data, ...prev]);
        } else if (event.type === 'update') {
          setUnreadNotifs(prev => event.data?.is_read ? prev.filter(n => n.id !== event.id) : prev.map(n => n.id === event.id ? event.data : n));
        } else if (event.type === 'delete') {
          setUnreadNotifs(prev => prev.filter(n => n.id !== event.id));
        }
      }
    });
    return unsub;
  }, [user?.email]);

  const homePath = user?.selected_role === 'avatar' ? '/AvatarDashboard' : user?.selected_role === 'enterprise' ? '/EnterpriseDashboard' : '/FindAvatars';
  const settingsPath = user?.selected_role === 'avatar' ? '/AvatarSettings' : user?.selected_role === 'enterprise' ? '/EnterpriseSettings' : '/Profile';

  return (
    <div className="min-h-screen flex overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 glass-strong border-r border-white/5 fixed inset-y-0 left-0 z-40">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <Link to={homePath} className="text-xl font-bold tracking-tight flex-1 py-3 px-2 rounded-lg hover:bg-white/5 transition-colors">
            Co<span className="text-primary">Task</span>
          </Link>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="hidden lg:flex justify-end mb-2">
            <NotificationBell userEmail={user?.email} userRole={user?.selected_role} />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
              {user?.full_name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          {user && <RoleSwitcher user={user} />}
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={() => base44.auth.logout('/Landing')}>
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 glass-strong border-b border-white/5 flex items-center justify-between px-4">
        <Link to={homePath} className="text-lg font-bold">Co<span className="text-primary">Task</span></Link>
        <NotificationBell userEmail={user?.email} userRole={user?.selected_role} />
      </div>

      {/* Profile Panel (full screen) */}
      {profileOpen && <ProfilePanel user={user} onClose={() => setProfileOpen(false)} />}

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-white/5 flex items-center justify-around px-2 py-2 pb-safe">
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
              className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
              <item.icon className="w-5 h-5" />
              {badgeCount > 0 && (
                <span className="absolute -top-0.5 right-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Profile tab */}
        <button
          onClick={() => setProfileOpen(true)}
          className={`relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            profileOpen ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
            {user?.full_name?.[0] || 'U'}
          </div>
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className={`flex-1 min-w-0 lg:ml-64 ${fullBleed ? '' : 'overflow-x-hidden pt-14 lg:pt-0 pb-28 lg:pb-0'}`}>
        {fullBleed ? children : (
          <div className="w-full min-w-0 px-4 py-4 lg:p-8 lg:max-w-7xl lg:mx-auto">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}