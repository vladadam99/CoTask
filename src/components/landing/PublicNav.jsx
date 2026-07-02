import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const links = [
    { label: 'Home', to: '/' },
    { label: 'How it works', to: '/HowItWorks' },
    { label: 'Pricing', to: '/Pricing' },
    { label: 'FAQ', to: '/FAQ' },
    { label: 'Safety', to: '/Safety' },
  ];

  const isActive = (to) => (to === '/' ? ['/', '/Landing'].includes(location.pathname) : location.pathname === to);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/95 text-foreground shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-black tracking-tight">
          Co<span className="text-primary">Task</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-semibold transition-colors ${
                isActive(link.to) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => base44.auth.redirectToLogin('/FindPeople')}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => base44.auth.redirectToLogin('/RoleSelect')}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started
          </button>
        </div>

        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(!open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-4 shadow-xl md:hidden">
          <div className="grid gap-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-3 text-sm font-semibold ${
                  isActive(link.to) ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 grid gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => {
                base44.auth.redirectToLogin('/FindPeople');
                setOpen(false);
              }}
              className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-foreground"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                base44.auth.redirectToLogin('/RoleSelect');
                setOpen(false);
              }}
              className="rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            >
              Get started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

