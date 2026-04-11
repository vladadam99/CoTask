import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Bell, X, CheckCheck } from 'lucide-react';

// These types are handled by bottom nav icons — exclude from bell
const EXCLUDED_FROM_BELL = ['message'];

const TYPE_COLORS = {

  booking_request: 'bg-blue-500/10 text-blue-400',
  booking_accepted: 'bg-green-500/10 text-green-400',
  booking_declined: 'bg-red-500/10 text-red-400',
  payment: 'bg-primary/10 text-primary',
  review: 'bg-yellow-500/10 text-yellow-400',
  session_live: 'bg-primary/10 text-primary',
  message: 'bg-purple-500/10 text-purple-400',
  system: 'bg-muted/50 text-muted-foreground',
};

export default function NotificationBell({ userEmail, userRole }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  // Load notifications
  useEffect(() => {
    if (!userEmail) return;
    const load = async () => {
      try {
        const list = await base44.entities.Notification.filter({ user_email: userEmail }, '-created_date', 50);
        // Show if no target_role restriction, or if it matches the user's role
        const filtered = list.filter(n => (!n.target_role || n.target_role === userRole) && !EXCLUDED_FROM_BELL.includes(n.type));
        setNotifications(filtered);
      } catch (e) {}
    };
    load();
  }, [userEmail]);

  // Real-time subscribe
  useEffect(() => {
    if (!userEmail) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email === userEmail) {
        const matchesRole = !event.data?.target_role || event.data?.target_role === userRole;
        const notExcluded = !EXCLUDED_FROM_BELL.includes(event.data?.type);
        if (event.type === 'create') {
          if (matchesRole && notExcluded) setNotifications(prev => [event.data, ...prev]);
        } else if (event.type === 'update') {
          setNotifications(prev => prev.map(n => n.id === event.id ? event.data : n));
        } else if (event.type === 'delete') {
          setNotifications(prev => prev.filter(n => n.id !== event.id));
        }
      }
    });
    return unsub;
  }, [userEmail]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifications.filter(n => !n.is_read);


  const markAllRead = async () => {
    const unreadItems = notifications.filter(n => !n.is_read);
    await Promise.all(unreadItems.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (n) => {
    if (n.is_read) return;
    await base44.entities.Notification.update(n.id, { is_read: true });
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
  };

  const handleNotifClick = async (n) => {
    await markRead(n);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (

    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unread.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 glass-strong border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-sm font-semibold">Notifications</span>
            <div className="flex items-center gap-2">
              {unread.length > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`px-4 py-3 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-primary' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}