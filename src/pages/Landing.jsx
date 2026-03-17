import React from 'react';
import PublicNav from '@/components/landing/PublicNav';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorks from '@/components/landing/HowItWorks';
import UseCases from '@/components/landing/UseCases';
import AvatarEarnings from '@/components/landing/AvatarEarnings';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <HeroSection />
      <HowItWorks />
      <UseCases />
      <AvatarEarnings />
      <CTASection />
      <Footer />
    </div>
  );
}