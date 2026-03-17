import React from 'react';
import { Badge } from '@/components/ui/badge';

const statusStyles = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  accepted: 'bg-green-500/10 text-green-400 border-green-500/20',
  declined: 'bg-red-500/10 text-red-400 border-red-500/20',
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_progress: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  live: 'bg-primary/10 text-primary border-primary/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
  disputed: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  verified: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  paid: 'bg-green-500/10 text-green-400 border-green-500/20',
  waiting: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  ended: 'bg-muted text-muted-foreground border-border',
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-muted text-muted-foreground border-border';
  const label = (status || 'unknown').replace(/_/g, ' ');

  return (
    <Badge variant="outline" className={`${style} border capitalize text-xs font-medium`}>
      {label}
    </Badge>
  );
}