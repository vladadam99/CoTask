import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="glass-strong rounded-2xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands connecting through real-world presence. Whether you need help or want to earn, CoTask is your platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/Explore">
                <Button size="lg" className="bg-primary hover:bg-primary/90 glow-primary-sm px-8">
                  Find an Avatar <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/RoleSelect">
                <Button size="lg" variant="outline" className="border-white/10 bg-white/5 px-8">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}