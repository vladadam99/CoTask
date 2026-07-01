import React from 'react';
import { Link } from 'react-router-dom';

const cols = [
  { head: 'Product', links: [{ l: 'How it works', to: '/HowItWorks' }, { l: 'Discover Local Agents', to: '/FindPeople' }, { l: 'Pricing', to: '/Pricing' }, { l: 'FAQ', to: '/FAQ' }] },
  { head: 'Company', links: [{ l: 'About', to: '/HowItWorks' }, { l: 'Trust & Safety', to: '/Safety' }, { l: 'Contact', to: '/Contact' }] },
  { head: 'Agents', links: [{ l: 'Become a Local Agent', to: '/Onboarding?role=avatar' }, { l: 'Agent FAQ', to: '/FAQ' }] },
  { head: 'Enterprise', links: [{ l: 'Business Solutions', to: '/Onboarding?role=enterprise' }, { l: 'Contact Sales', to: '/Contact' }] },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card px-6 py-16 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link to="/Landing" className="mb-4 block text-2xl font-black tracking-tight text-foreground">
              Co<span className="text-primary">Task</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">Be there without being there.</p>
          </div>
          {cols.map((col) => (
            <div key={col.head}>
              <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">{col.head}</h4>
              <div className="space-y-3">
                {col.links.map((item) => (
                  <Link key={item.l} to={item.to} className="block text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {item.l}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">Copyright 2026 CoTask. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Remote physical tasks, live video, messaging, and Secure Payment.</p>
        </div>
      </div>
    </footer>
  );
}
