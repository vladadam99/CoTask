import { Search, Calendar, MessageSquare, Home, User, Inbox, DollarSign, Settings, Building2, Briefcase, Users, Wallet, Plus, UserSearch, BookOpen, Compass } from 'lucide-react';

export const userNavItems = [
  { icon: Compass, label: 'Explore', path: '/Explore' },
  { icon: Plus, label: 'Post Task', path: '/PostJob' },
  { icon: Calendar, label: 'My Tasks', path: '/Bookings' },
  { icon: MessageSquare, label: 'Messages', path: '/Messages' },
  ];

  export const avatarNavItems = [
  { icon: Briefcase, label: 'Task Board', path: '/JobMarketplace' },
  { icon: Calendar, label: 'Schedule', path: '/AvatarRequests' },
  { icon: MessageSquare, label: 'Messages', path: '/AvatarMessages' },
  { icon: Wallet, label: 'Earnings', path: '/AvatarWallet' },
  ];

export const enterpriseNavItems = [
  { icon: Building2, label: 'Dashboard', path: '/EnterpriseDashboard' },
  { icon: Calendar, label: 'Tasks', path: '/Bookings' },
  { icon: Users, label: 'Team or Company', path: '/EnterpriseSettings' },
  { icon: DollarSign, label: 'Billing', path: '/EnterpriseSettings' },
  { icon: Settings, label: 'Settings', path: '/EnterpriseSettings' },
];

export function getNavItems(role) {
  if (role === 'avatar') return avatarNavItems;
  if (role === 'enterprise') return enterpriseNavItems;
  return userNavItems;
}
