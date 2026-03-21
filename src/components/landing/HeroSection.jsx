import React from 'react';
import { ArrowRight, MapPin, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-background flex flex-col justify-center overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{backgroundImage: 'linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)', backgroundSize: '60px 60px'}}
      />
      {/* Red accent blob */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-20 items-center min-h-[80vh]">

          {/* LEFT */}
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>

            {/* Pill badge */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 mb-10 bg-white/5 border border-white/10 rounded-full px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-white/70 tracking-wide uppercase">Live in 50+ cities worldwide</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-8 text-white">
              Your eyes.<br />
              <span className="text-primary">Anywhere.</span><br />
              Right now.
            </h1>

            <p className="text-white/50 text-xl max-w-md leading-relaxed mb-12">
              Book a verified local avatar to see, do, and act on your behalf — streamed live, from anywhere in the world.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link to="/Explore">
                <button className="group flex items-center justify-center gap-3 bg-white text-black font-bold text-base px-8 py-4 rounded-full hover:bg-white/90 transition-all duration-200 w-full sm:w-auto">
                  Find an Avatar
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link to="/Onboarding?role=avatar">
                <button className="flex items-center justify-center gap-3 border border-white/20 text-white font-semibold text-base px-8 py-4 rounded-full hover:border-white/50 hover:bg-white/5 transition-all duration-200 w-full sm:w-auto">
                  Become an Avatar
                </button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-8">
              <div>
                <div className="text-3xl font-black text-white">10K+</div>
                <div className="text-xs text-white/40 mt-1 uppercase tracking-widest">Active Avatars</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <div className="text-3xl font-black text-white">4.9</div>
                <div className="text-xs text-white/40 mt-1 uppercase tracking-widest">Avg Rating</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <div className="text-3xl font-black text-white">50+</div>
                <div className="text-xs text-white/40 mt-1 uppercase tracking-widest">Cities</div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT — UI mockup */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:flex flex-col gap-4">

            {/* Main card */}
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
              {/* Video area */}
              <div className="relative h-72 bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-end p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent" />
                {/* LIVE badge */}
                <div className="absolute top-5 left-5 flex items-center gap-2 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                </div>
                {/* Time */}
                <div className="absolute top-5 right-5 bg-black/60 text-white/80 text-xs font-mono px-3 py-1.5 rounded-full">
                  32:14
                </div>
                {/* Avatar info */}
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/30 border-2 border-primary/60 flex items-center justify-center text-lg font-black text-white">S</div>
                  <div>
                    <p className="text-white font-bold">Sarah K.</p>
                    <p className="text-white/60 text-sm flex items-center gap-1"><MapPin className="w-3 h-3" /> Tokyo, Shibuya</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 bg-black/40 rounded-full px-3 py-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-white text-sm font-semibold">4.9</span>
                  </div>
                </div>
              </div>

              {/* Card footer */}
              <div className="px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">City Guide Session</p>
                  <p className="text-white/40 text-sm">312 sessions · Verified</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-lg">$35<span className="text-white/40 text-sm font-normal">/hr</span></p>
                </div>
              </div>
            </div>

            {/* Two floating cards */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 text-sm font-bold">✓</span>
                  </div>
                  <p className="text-white/60 text-xs">Job completed</p>
                </div>
                <p className="text-white font-black text-2xl">+$45</p>
                <p className="text-white/30 text-xs mt-1">Property tour · NYC</p>
              </motion.div>

              <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 0.5 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-primary" />
                  <p className="text-white/60 text-xs">Instant match</p>
                </div>
                <p className="text-white font-bold text-sm">Avatar nearby</p>
                <p className="text-primary text-xs mt-1">Starting in 3 min →</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}