import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function PublicNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/Landing" className="text-xl font-bold tracking-tight">
          Co<span className="text-primary">Task</span>
        </Link>
        
        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/HowItWorks" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</Link>
          <Link to="/ExploreOnboarding" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
          <Link to="/Pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/FAQ" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
        </div>
        
        <div className="hidden md:flex items-center gap-3">
           <button onClick={() => window.location.href = '/Explore'}>
             <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
               Sign in
             </Button>
           </button>
           <button onClick={() => { localStorage.setItem('cotask_role', 'user'); window.location.href = '/Onboarding'; }}>
             <Button size="sm" className="bg-primary hover:bg-primary/90">
               Get started
             </Button>
           </button>
         </div>

        {/* Mobile */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      
      {open && (
        <div className="md:hidden glass-strong border-t border-white/5 px-6 py-4 space-y-3">
          <Link to="/HowItWorks" className="block py-2 text-sm text-muted-foreground" onClick={() => setOpen(false)}>How it works</Link>
          <Link to="/ExploreOnboarding" className="block py-2 text-sm text-muted-foreground" onClick={() => setOpen(false)}>Explore</Link>
          <Link to="/Pricing" className="block py-2 text-sm text-muted-foreground" onClick={() => setOpen(false)}>Pricing</Link>
          <Link to="/FAQ" className="block py-2 text-sm text-muted-foreground" onClick={() => setOpen(false)}>FAQ</Link>
          <Link to="/RoleSelect" onClick={() => setOpen(false)}>
            <Button className="w-full bg-primary hover:bg-primary/90 mt-2">Get started</Button>
          </Link>
        </div>
      )}
    </nav>
  );
}