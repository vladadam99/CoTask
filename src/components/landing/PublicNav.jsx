import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/95 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link to="/Landing" className="text-xl font-black tracking-tighter text-white">
          Co<span className="text-primary">Task</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-10">
          <Link to="/HowItWorks" className="text-sm text-white/50 hover:text-white transition-colors font-medium">How it works</Link>
          <Link to="/Explore" className="text-sm text-white/50 hover:text-white transition-colors font-medium">Explore</Link>
          <Link to="/Pricing" className="text-sm text-white/50 hover:text-white transition-colors font-medium">Pricing</Link>
          <Link to="/FAQ" className="text-sm text-white/50 hover:text-white transition-colors font-medium">FAQ</Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => base44.auth.redirectToLogin('/UserDashboard')}
            className="text-sm font-semibold text-white/60 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/5">
            Sign in
          </button>
          <Link to="/RoleSelect">
            <button className="bg-white text-black text-sm font-bold px-5 py-2 rounded-full hover:bg-white/90 transition-all">
              Get started
            </button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-xl hover:bg-white/5 text-white">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-background border-t border-white/5 px-6 py-6 space-y-4">
          {[{label:'How it works', to:'/HowItWorks'},{label:'Explore',to:'/Explore'},{label:'Pricing',to:'/Pricing'},{label:'FAQ',to:'/FAQ'}].map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block py-2 text-white/60 font-medium text-sm hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button onClick={() => { base44.auth.redirectToLogin('/UserDashboard'); setOpen(false); }}
              className="flex-1 border border-white/10 text-white font-semibold text-sm py-3 rounded-full hover:bg-white/5 transition-colors">
              Sign in
            </button>
            <Link to="/RoleSelect" onClick={() => setOpen(false)} className="flex-1">
              <button className="w-full bg-white text-black font-bold text-sm py-3 rounded-full hover:bg-white/90 transition-colors">
                Get started
              </button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}