import { Search, Calendar, MessageSquare, Home, User, Inbox, DollarSign, Settings, Building2, Briefcase, Users, Wallet, Plus, UserSearch, BookOpen, Compass } from 'lucide-react';

export const userNavItems = [
  { icon: Compass, label: 'Discover', path: '/FindPeople' },
  { icon: Plus, label: 'Post Task', path: '/PostJob' },
  { icon: Calendar, label: 'My Tasks', path: '/Bookings' },
  { icon: MessageSquare, label: 'Messages', path: '/Messages' },
];

export const avatarNavItems = [
  { icon: Briefcase, label: 'Job Board', path: '/JobMarketplace' },
  { icon: Calendar, label: 'My Schedule', path: '/AvatarRequests' },
  { icon: MessageSquare, label: 'Messages', path: '/AvatarMessages' },
  { icon: Wallet, label: 'Earnings', path: '/AvatarWallet' },
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