import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Star, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const stats = [
  { value: '10K+', label: 'Active Avatars' },
  { value: '50+', label: 'Cities covered' },
  { value: '4.9★', label: 'Average rating' },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-background">
      {/* Subtle red glow top center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live human presence, anywhere
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
              Be there<br />
              <span className="text-primary">without</span><br />
              being there.
            </h1>

            <p className="text-lg text-muted-foreground max-w-md mb-10 leading-relaxed">
              Book a trusted local avatar to be your eyes, hands, and guide — live, anywhere in the world.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Link to="/Explore">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 h-13 text-base font-semibold glow-primary-sm w-full sm:w-auto">
                  Find an Avatar
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/Onboarding?role=avatar">
                <Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5 px-8 h-13 text-base w-full sm:w-auto">
                  Become an Avatar
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 border-t border-white/5 pt-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Live session card mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="relative">
              {/* Main card */}
              <div className="glass-strong rounded-2xl overflow-hidden border border-white/10">
                {/* Fake video */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 h-64 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                  <div className="relative z-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl font-bold text-primary">S</span>
                    </div>
                    <p className="text-sm text-white font-medium">Sarah K.</p>
                    <p className="text-xs text-white/60">Tokyo, Japan</p>
                  </div>
                  {/* Live badge */}
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-primary/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm">City Guide – Shibuya</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> Tokyo, Japan
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400 text-sm font-semibold">
                      <Star className="w-3.5 h-3.5 fill-yellow-400" /> 4.9
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>Verified Avatar · 312 sessions</span>
                  </div>
                </div>
              </div>

              {/* Floating booking card */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute -bottom-6 -left-8 glass rounded-xl p-4 border border-white/10 shadow-xl w-48"
              >
                <p className="text-xs text-muted-foreground mb-1">Session booked</p>
                <p className="font-semibold text-sm">Property tour</p>
                <p className="text-xs text-primary mt-1">Starting in 5 min →</p>
              </motion.div>

              {/* Floating rating card */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
                className="absolute -top-6 -right-6 glass rounded-xl p-3 border border-white/10 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-sm">✓</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Job complete</p>
                    <p className="text-xs text-muted-foreground">+$45 earned</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}