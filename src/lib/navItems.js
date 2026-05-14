import { Search, Calendar, MessageSquare, Home, User, Inbox, DollarSign, Settings, Building2, Briefcase, Users, Wallet, Plus, UserSearch, BookOpen } from 'lucide-react';

export const userNavItems = [
  { icon: UserSearch, label: 'Avatars', path: '/FindAvatars' },
  { icon: BookOpen, label: 'Consult', path: '/ExpertConsult' },
  { icon: Plus, label: 'Post Job', path: '/PostJob' },
  { icon: MessageSquare, label: 'Messages', path: '/Messages' },
];

export const avatarNavItems = [
  { icon: Briefcase, label: 'Jobs', path: '/JobMarketplace' },
  { icon: Home, label: 'Home', path: '/AvatarDashboard' },
  { icon: MessageSquare, label: 'Messages', path: '/AvatarMessages' },
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