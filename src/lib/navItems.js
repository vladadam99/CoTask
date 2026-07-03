import { Calendar, MessageSquare, Home, DollarSign, Building2, Briefcase, Users, Wallet, Plus, Compass } from 'lucide-react';

export const userNavItems = [
  { icon: Compass, label: 'Explore', path: '/Explore' },
  { icon: Plus, label: 'Create', path: '/PostJob' },
  { icon: Calendar, label: 'Workboard', path: '/Bookings' },
  { icon: MessageSquare, label: 'Inbox', path: '/Messages' },
  ];

  export const avatarNavItems = [
  { icon: Home, label: 'Home', path: '/AvatarDashboard' },
  { icon: Briefcase, label: 'Task Board', path: '/JobMarketplace' },
  { icon: Calendar, label: 'Schedule', path: '/AvatarRequests' },
  { icon: MessageSquare, label: 'Messages', path: '/AvatarMessages' },
  { icon: Wallet, label: 'Earnings', path: '/AvatarWallet' },
  ];

export const enterpriseNavItems = [
  { icon: Building2, label: 'Dashboard', path: '/EnterpriseDashboard' },
  { icon: Calendar, label: 'Tasks', path: '/Bookings' },
  { icon: Building2, label: 'Profile', path: '/EnterpriseProfile' },
  { icon: Users, label: 'Team', path: '/EnterpriseTeam' },
  { icon: DollarSign, label: 'Billing', path: '/EnterpriseBilling' },
];

export function getNavItems(role) {
  if (role === 'avatar') return avatarNavItems;
  if (role === 'enterprise') return enterpriseNavItems;
  return userNavItems;
}

