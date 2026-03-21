import React from 'react';
import { Link } from 'react-router-dom';

const links = {
  Product: [
    { label: 'How it works', to: '/HowItWorks' },
    { label: 'Explore Avatars', to: '/Explore' },
    { label: 'Pricing', to: '/Pricing' },
    { label: 'FAQ', to: '/FAQ' },
  ],
  Company: [
    { label: 'About', to: '/HowItWorks' },
    { label: 'Trust & Safety', to: '/Safety' },
    { label: 'Contact', to: '/Contact' },
  ],
  Avatars: [
    { label: 'Become an Avatar', to: '/Onboarding?role=avatar' },
    { label: 'Avatar FAQ', to: '/FAQ' },
  ],
  Enterprise: [
    { label: 'Business Solutions', to: '/Onboarding?role=enterprise' },
    { label: 'Contact Sales', to: '/Contact' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/Landing" className="text-2xl font-black tracking-tight block mb-4">
              Co<span className="text-primary">Task</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[160px]">
              Real presence, anywhere in the world.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">{group}</h4>
              <div className="space-y-3">
                {items.map(item => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 CoTask. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Be there without being there.</p>
        </div>
      </div>
    </footer>
  );
}