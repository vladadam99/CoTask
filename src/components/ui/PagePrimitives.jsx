import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageHero({ eyebrow, title, description, icon: Icon, actions, stats = [], className = '' }) {
  return (
    <section className={cn('relative overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-sm', className)}>
      <div className="absolute inset-y-0 right-0 hidden w-1/3 professional-grid opacity-20 lg:block" />
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
      <div className="relative p-4 md:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            {eyebrow && <p className="text-xs font-bold tracking-[0.18em] text-primary">{eyebrow}</p>}
            <div className="mt-2 flex items-start gap-3">
              {Icon && (
                <div className="mt-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary sm:flex">
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
                {description && (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
          {actions && <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">{actions}</div>}
        </div>

        {stats.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-secondary/45 p-3">
                <p className="text-[11px] font-semibold text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-lg font-black text-foreground">{stat.value}</p>
                {stat.hint && <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function MetricCard({ icon: Icon, label, value, hint, tone = 'primary', className = '' }) {
  const toneClasses = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    neutral: 'bg-secondary text-muted-foreground',
  };

  return (
    <div className={cn('surface-panel rounded-lg p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-foreground">{value}</p>
        </div>
        {Icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', toneClasses[tone] || toneClasses.primary)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {hint && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({ icon: Icon = CheckCircle2, title, description, action, className = '' }) {
  return (
    <div className={cn('surface-panel rounded-lg p-10 text-center md:p-12', className)}>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, description, action, className = '' }) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        {eyebrow && <p className="section-label">{eyebrow}</p>}
        <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ToolbarPanel({ children, className = '' }) {
  return (
    <div className={cn('surface-panel rounded-lg p-4 md:p-5', className)}>
      {children}
    </div>
  );
}
