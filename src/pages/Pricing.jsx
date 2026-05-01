import React from 'react';
import InfoPageHeader from '@/components/layout/InfoPageHeader';
import Footer from '@/components/landing/Footer';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Pay as you go',
    subtitle: 'For individual users',
    price: 'From $25/hr',
    features: [
      'Browse all available avatars',
      'Book on-demand or scheduled',
      'In-app messaging',
      'Live session access',
      'Secure payments',
      'Rating & reviews',
    ],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Pro',
    subtitle: 'For frequent users',
    price: '$99/mo',
    features: [
      'Everything in Pay as you go',
      'Priority avatar matching',
      'Reduced platform fees (10%)',
      'Saved preferences',
      'Dedicated support',
      'Session recordings (coming soon)',
    ],
    cta: 'Start Free Trial',
    featured: true,
  },
  {
    name: 'Enterprise',
    subtitle: 'For businesses',
    price: 'Custom',
    features: [
      'Everything in Pro',
      'Bulk booking discounts',
      'Custom invoicing',
      'Team management',
      'API access (coming soon)',
      'Dedicated account manager',
      'SLA guarantees',
    ],
    cta: 'Contact Sales',
    featured: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen">
      <InfoPageHeader />
      <div className="pt-24 pb-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Pay only for what you use. Avatars set their own rates. CoTask charges a small platform fee.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <GlassCard key={plan.name} className={`p-8 flex flex-col ${plan.featured ? 'border-primary/30 relative' : ''}`}>
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                <p className="text-3xl font-bold mt-4">{plan.price}</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/RoleSelect">
                <Button className={`w-full ${plan.featured ? 'bg-primary hover:bg-primary/90' : 'bg-muted hover:bg-muted/80 text-foreground'}`}>
                  {plan.cta}
                </Button>
              </Link>
            </GlassCard>
          ))}
        </div>

        <div className="text-center mt-12">
          <h3 className="font-semibold mb-2">Avatar earnings</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Avatars keep 85% of every booking. Set your own hourly or per-session rate. 
            Get paid directly to your account after each completed session.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}