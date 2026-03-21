import React from 'react';
import { Link } from 'react-router-dom';

const cols = [
  { head: 'Product', links: [{l:'How it works',to:'/HowItWorks'},{l:'Explore Avatars',to:'/Explore'},{l:'Pricing',to:'/Pricing'},{l:'FAQ',to:'/FAQ'}] },
  { head: 'Company', links: [{l:'About',to:'/HowItWorks'},{l:'Trust & Safety',to:'/Safety'},{l:'Contact',to:'/Contact'}] },
  { head: 'Avatars', links: [{l:'Become an Avatar',to:'/Onboarding?role=avatar'},{l:'Avatar FAQ',to:'/FAQ'}] },
  { head: 'Enterprise', links: [{l:'Business Solutions',to:'/Onboarding?role=enterprise'},{l:'Contact Sales',to:'/Contact'}] },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-20 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <Link to="/Landing" className="text-2xl font-black tracking-tighter text-white block mb-4">
              Co<span className="text-primary">Task</span>
            </Link>
            <p className="text-sm text-white/30 leading-relaxed">Real presence,<br />anywhere in the world.</p>
          </div>
          {cols.map(col => (
            <div key={col.head}>
              <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-white/30 mb-5">{col.head}</h4>
              <div className="space-y-3">
                {col.links.map(item => (
                  <Link key={item.l} to={item.to} className="block text-sm text-white/50 hover:text-white transition-colors">{item.l}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/20">© 2026 CoTask. All rights reserved.</p>
          <p className="text-xs text-white/20">Be there without being there.</p>
        </div>
      </div>
    </footer>
  );
}