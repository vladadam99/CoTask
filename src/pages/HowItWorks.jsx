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
      <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">How CoTask Works</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
          CoTask bridges the gap between being somewhere and needing to be there. Real people, real places, real time.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 text-left mb-16">
          {[
            { icon: Zap, title: 'Not a Video Call', desc: 'Unlike Zoom or FaceTime, CoTask gives you a trained local person who physically goes to a location and acts as your remote presence.' },
            { icon: Globe, title: 'Not a YouTube Tour', desc: 'This is live, interactive, and personalized. You direct the experience in real time. Ask questions, zoom in, pivot direction.' },
            { icon: Users, title: 'Not a Task App', desc: 'CoTask avatars are trained, verified, and equipped for live sessions. They are your eyes, hands, and guide — not just an errand runner.' },
            { icon: Shield, title: 'Trust Built In', desc: 'Every avatar is verified, reviewed, and rated. Every session is tracked. Your safety and privacy are our top priority.' },
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