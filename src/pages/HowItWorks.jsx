import React from 'react';
import InfoPageHeader from '@/components/layout/InfoPageHeader';
import Footer from '@/components/landing/Footer';
import HowItWorksSection from '@/components/landing/HowItWorks';
import UseCases from '@/components/landing/UseCases';
import CTASection from '@/components/landing/CTASection';
import { Shield, Users, Zap, Globe } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export default function HowItWorks() {
  return (
    <div className="min-h-screen">
      <InfoPageHeader />
      <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-6 md:p-8 text-center shadow-sm mb-12">
          <p className="text-xs font-bold tracking-[0.18em] text-primary">How it works</p>
          <h1 className="text-4xl md:text-5xl font-black mt-3 mb-4 text-foreground">How CoTask Works</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            CoTask bridges the gap between being somewhere and needing to be there. Real people, real places, real time.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 text-left mb-16">
          {[
            { icon: Zap, title: 'Not a Video Call', desc: 'Unlike Zoom or FaceTime, CoTask gives you a trained local person who physically goes to a location and acts as your remote presence.' },
            { icon: Globe, title: 'Not a YouTube Tour', desc: 'This is live, interactive, and personalized. You direct the experience in real time. Ask questions, zoom in, pivot direction.' },
            { icon: Users, title: 'Not a generic task app', desc: 'CoTask is built around Local Agent profiles, messaging, proof, live session handoff, and Secure Payment status.' },
            { icon: Shield, title: 'Trust built in', desc: 'Profiles, reviews, task records, proof uploads, and issue reporting make each task easier to review.' },
          ].map(item => (
            <GlassCard key={item.title} className="p-6">
              <item.icon className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
      <HowItWorksSection />
      <UseCases />
      <CTASection />
      <Footer />
    </div>
  );
}
