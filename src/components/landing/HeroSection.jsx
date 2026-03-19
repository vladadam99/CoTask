import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Live human presence, anywhere
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
            Be there without{' '}
            <span className="text-gradient">being there</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            CoTask connects you with trusted avatars who can help, guide, show, inspect, assist, 
            and stream live — anywhere in the real world, in real time.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => { localStorage.setItem('cotask_role', 'user'); window.location.href = '/Onboarding'; }}>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base glow-primary-sm">
                Find an Avatar
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </button>
            <button onClick={() => { localStorage.setItem('cotask_role', 'avatar'); window.location.href = '/Onboarding'; }}>
              <Button size="lg" variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 px-8 py-6 text-base">
                <Play className="mr-2 w-5 h-5" />
                Become an Avatar
              </Button>
            </button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Or{' '}
            <button onClick={() => { localStorage.setItem('cotask_role', 'enterprise'); window.location.href = '/Onboarding'; }} className="text-primary hover:underline">
              book for your business →
            </button>
          </p>
        </motion.div>
      </div>
    </section>
  );
}