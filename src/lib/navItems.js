import { Search, Calendar, MessageSquare, Radio, Heart, User, Zap, Inbox, DollarSign, Settings, Building2 } from 'lucide-react';

export const userNavItems = [
  { icon: Search, label: 'Explore', path: '/Explore' },
  { icon: Radio, label: 'Live', path: '/LiveSessions' },
  { icon: Calendar, label: 'Bookings', path: '/Bookings' },
  { icon: MessageSquare, label: 'Messages', path: '/Messages' },
  { icon: Heart, label: 'Saved', path: '/Saved' },
  { icon: User, label: 'Profile', path: '/Profile' },
];

export const avatarNavItems = [
  { icon: Zap, label: 'Go Live', path: '/AvatarLive' },
  { icon: Inbox, label: 'Bookings', path: '/AvatarRequests' },
  { icon: DollarSign, label: 'Earnings', path: '/AvatarEarnings' },
  { icon: User, label: 'Setup', path: '/AvatarProfileEdit' },
];

export const enterpriseNavItems = [
  { icon: Search, label: 'Deploy Avatar', path: '/Explore' },
  { icon: Calendar, label: 'Sessions', path: '/Bookings' },
  { icon: MessageSquare, label: 'Messages', path: '/Messages' },
  { icon: Building2, label: 'Dashboard', path: '/EnterpriseDashboard' },
  { icon: Settings, label: 'Settings', path: '/EnterpriseSettings' },
];

export function getNavItems(role) {
  if (role === 'avatar') return avatarNavItems;
  if (role === 'enterprise') return enterpriseNavItems;
  return userNavItems;
}