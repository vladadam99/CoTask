import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X, HelpCircle, Settings, User, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import NotificationBell from '@/components/notifications/NotificationBell';
import RoleSwitcher from '@/components/RoleSwitcher';

export default function AppShell({ children, navItems = [], user }) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const homePath = user?.role === 'avatar' ? '/AvatarDashboard' : user?.role === 'enterprise' ? '/EnterpriseDashboard' : '/UserDashboard';
  const settingsPath = user?.role === 'avatar' ? '/AvatarSettings' : user?.role === 'enterprise' ? '/EnterpriseSettings' : '/Profile';

  return (
    <div className="min-h-screen flex overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 glass-strong border-r border-white/5 fixed inset-y-0 left-0 z-40">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <Link to={
            user?.role === 'avatar' ? '/AvatarDashboard'
            : user?.role === 'enterprise' ? '/EnterpriseDashboard'
            : '/UserDashboard'
          } className="text-xl font-bold tracking-tight">
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
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="hidden lg:flex justify-end mb-2">
            <NotificationBell userEmail={user?.email} userRole={user?.role} />
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
        <div className="flex items-center gap-2">
          <NotificationBell userEmail={user?.email} userRole={user?.role} />
          <button onClick={() => setDrawerOpen(true)} className="p-3 -mr-1 rounded-lg hover:bg-white/10 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute right-0 inset-y-0 w-72 glass-strong border-l border-white/10 flex flex-col">
            {/* Drawer Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/5">
              <span className="font-bold text-sm">Menu</span>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-base font-bold text-primary">
                  {user?.full_name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Drawer Links */}
            <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
              <Link to="/Profile" onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>Profile</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </Link>
              <Link to={settingsPath} onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span>Settings</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </Link>
              <Link to="/FAQ" onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors text-sm">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                <span>Help & FAQ</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </Link>
            </nav>

            {/* Sign Out */}
            <div className="p-4 border-t border-white/5">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => base44.auth.logout('/Landing')}>
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-white/5 flex items-center justify-around px-2 py-2 pb-safe">
        {navItems.slice(0, 5).map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-x-hidden lg:ml-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        <div className="w-full min-w-0 px-4 py-4 lg:p-8 lg:max-w-7xl lg:mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}