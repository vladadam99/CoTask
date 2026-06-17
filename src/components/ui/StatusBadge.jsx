import React from 'react';
import { Badge } from '@/components/ui/badge';

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20',
  accepted: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
  declined: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  in_progress: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20',
  live: 'bg-primary/10 text-primary border-primary/20',
  completed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
  cancelled: 'bg-secondary text-muted-foreground border-border',
  disputed: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
  active: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
  inactive: 'bg-secondary text-muted-foreground border-border',
  verified: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  paid: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
  waiting: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20',
  ended: 'bg-secondary text-muted-foreground border-border',
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-muted text-muted-foreground border-border';
  
  let label = (status || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  if (status === 'pending') label = 'Waiting for Local Agent';
  if (status === 'accepted') label = 'Local Agent Accepted';
  if (status === 'payment_required') label = 'Secure Payment Required';
  if (status === 'held') label = 'Secure Payment Held';
  if (status === 'awaiting_approval') label = 'Waiting for Client Approval';

  return (
    <Badge variant="outline" className={`${style} border text-xs font-medium`}>
      {label}
    </Badge>
  );
}