import React from 'react';
import InfoPageHeader from '@/components/layout/InfoPageHeader';
import Footer from '@/components/landing/Footer';
import GlassCard from '@/components/ui/GlassCard';
import { Shield, UserCheck, Eye, Lock, AlertTriangle, Star } from 'lucide-react';

const features = [
  { icon: UserCheck, title: 'Identity Verification', desc: 'Every avatar undergoes identity verification before they can accept bookings. We verify government-issued IDs and conduct background checks.' },
  { icon: Shield, title: 'Secure Payments', desc: 'All transactions are processed through our secure payment system. Funds are held in escrow until sessions are completed to your satisfaction.' },
  { icon: Star, title: 'Reviews & Ratings', desc: 'Both clients and avatars can rate each other after every session. This creates accountability and helps maintain high service quality.' },
  { icon: Eye, title: 'Session Monitoring', desc: 'All sessions are logged with timestamps, duration, and participant information. Suspicious activity is flagged for review.' },
  { icon: Lock, title: 'Data Privacy', desc: 'Your personal data is encrypted and never shared without consent. We comply with GDPR and other data protection regulations.' },
  { icon: AlertTriangle, title: 'Dispute Resolution', desc: 'If something goes wrong, our dedicated support team mediates disputes fairly. Refunds are processed promptly when warranted.' },
];

export default function Safety() {
  return (
    <div className="min-h-screen">
      <InfoPageHeader />
      <div className="pt-24 pb-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Trust & Safety</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your safety is our top priority. Every interaction on CoTask is designed with trust, transparency, and protection in mind.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <GlassCard key={f.title} className="p-6">
              <f.icon className="w-6 h-6 text-primary mb-4" />
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}