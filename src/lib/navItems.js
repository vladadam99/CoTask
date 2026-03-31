import { Search, Calendar, MessageSquare, Home, Heart, User, Zap, Inbox, DollarSign, Settings, Building2, Briefcase, Compass, Users } from 'lucide-react';

export const userNavItems = [
  { icon: Home, label: 'Home', path: '/UserDashboard' },
  { icon: Search, label: 'Explore', path: '/Explore' },
  { icon: Calendar, label: 'Bookings', path: '/Bookings' },
  { icon: MessageSquare, label: 'Messages', path: '/Messages' },
];

export const avatarNavItems = [
  { icon: Home, label: 'Home', path: '/AvatarDashboard' },
  { icon: Compass, label: 'Explore', path: '/AvatarExplore' },
  { icon: Briefcase, label: 'Jobs', path: '/JobMarketplace' },
  { icon: MessageSquare, label: 'Messages', path: '/AvatarMessages' },
  { icon: Inbox, label: 'Bookings', path: '/AvatarRequests' },
  { icon: DollarSign, label: 'Earnings', path: '/AvatarEarnings' },
  { icon: User, label: 'Profile', path: '/AvatarProfileEdit' },
];

export const enterpriseNavItems = [
  { icon: Search, label: 'Deploy Avatar', path: '/Explore' },
  { icon: Briefcase, label: 'Jobs', path: '/JobMarketplace' },
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