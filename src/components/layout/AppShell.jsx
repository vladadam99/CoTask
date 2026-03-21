import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import NotificationBell from '@/components/notifications/NotificationBell';
import RoleSwitcher from '@/components/RoleSwitcher';

export default function AppShell({ children, navItems = [], user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
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
            <NotificationBell userEmail={user?.email} />
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

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 glass-strong border-b border-white/5 flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu className="w-5 h-5" />
        </button>
        <Link to={
          user?.role === 'avatar' ? '/AvatarDashboard'
          : user?.role === 'enterprise' ? '/EnterpriseDashboard'
          : '/UserDashboard'
        } className="text-lg font-bold">Co<span className="text-primary">Task</span></Link>
        <NotificationBell userEmail={user?.email} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 inset-y-0 w-72 glass-strong border-r border-white/5 flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/5">
              <span className="text-lg font-bold">Co<span className="text-primary">Task</span></span>
              <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {navItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}>
                    <item.icon className="w-4.5 h-4.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}