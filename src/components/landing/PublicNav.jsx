import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-background/90 backdrop-blur-xl border-b border-white/5 shadow-md' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/Landing" className="text-xl font-black tracking-tight">
          Co<span className="text-primary">Task</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/HowItWorks" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">How it works</Link>
          <Link to="/Explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Explore</Link>
          <Link to="/Pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Pricing</Link>
          <Link to="/FAQ" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">FAQ</Link>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => base44.auth.redirectToLogin('/UserDashboard')}>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-medium">
              Sign in
            </Button>
          </button>
          <Link to="/RoleSelect">
            <Button size="sm" className="bg-primary hover:bg-primary/90 font-semibold px-5">
              Get started
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 rounded-lg hover:bg-white/5" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-background border-t border-white/5 px-6 py-5 space-y-4">
          <Link to="/HowItWorks" className="block py-2 text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>How it works</Link>
          <Link to="/Explore" className="block py-2 text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>Explore</Link>
          <Link to="/Pricing" className="block py-2 text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>Pricing</Link>
          <Link to="/FAQ" className="block py-2 text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>FAQ</Link>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { base44.auth.redirectToLogin('/UserDashboard'); setOpen(false); }} className="flex-1">
              <Button variant="outline" className="w-full border-white/10">Sign in</Button>
            </button>
            <Link to="/RoleSelect" className="flex-1" onClick={() => setOpen(false)}>
              <Button className="w-full bg-primary hover:bg-primary/90">Get started</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}