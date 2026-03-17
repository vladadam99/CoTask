import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-semibold text-sm mb-4">Product</h4>
            <div className="space-y-2">
              <Link to="/HowItWorks" className="block text-sm text-muted-foreground hover:text-foreground">How it works</Link>
              <Link to="/Explore" className="block text-sm text-muted-foreground hover:text-foreground">Explore Avatars</Link>
              <Link to="/Pricing" className="block text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Company</h4>
            <div className="space-y-2">
              <Link to="/HowItWorks" className="block text-sm text-muted-foreground hover:text-foreground">About</Link>
              <Link to="/Safety" className="block text-sm text-muted-foreground hover:text-foreground">Trust & Safety</Link>
              <Link to="/Contact" className="block text-sm text-muted-foreground hover:text-foreground">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Avatars</h4>
            <div className="space-y-2">
              <Link to="/RoleSelect" className="block text-sm text-muted-foreground hover:text-foreground">Become an Avatar</Link>
              <Link to="/FAQ" className="block text-sm text-muted-foreground hover:text-foreground">Avatar FAQ</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4">Enterprise</h4>
            <div className="space-y-2">
              <Link to="/RoleSelect" className="block text-sm text-muted-foreground hover:text-foreground">Business Solutions</Link>
              <Link to="/Contact" className="block text-sm text-muted-foreground hover:text-foreground">Contact Sales</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 CoTask. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Be there without being there.
          </p>
        </div>
      </div>
    </footer>
  );
}