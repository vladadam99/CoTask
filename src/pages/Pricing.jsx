import React from 'react';
import { Link } from 'react-router-dom';
import { Check, CreditCard, Receipt, Shield } from 'lucide-react';
import InfoPageHeader from '@/components/layout/InfoPageHeader';
import Footer from '@/components/landing/Footer';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';

const sections = [
  {
    icon: CreditCard,
    title: 'Client payments',
    items: [
      'Task price is shown before you send or fund a request',
      'Secure Payment is used when the workflow requires funding before work begins',
      'Payment status is visible on the task detail page',
      'Receipts and payment history appear in Billing / Payments',
    ],
  },
  {
    icon: Receipt,
    title: 'Local Agent earnings',
    items: [
      'Local Agents set their own hourly or fixed task rates',
      'Pending and released amounts appear in Earnings',
      'Payout preferences are saved for manual Production V1 review',
      'Task completion and client approval drive release status',
    ],
  },
  {
    icon: Shield,
    title: 'Enterprise workflows',
    items: [
      'Use team profiles for repeated site checks and field operations',
      'Coordinate direct requests and open tasks from one account',
      'Supported invoicing and billing options are shown in account settings',
      'Enterprise terms can be handled through the sales/support flow',
    ],
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <InfoPageHeader />
      <main className="px-6 pb-20 pt-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 rounded-lg border border-border bg-card p-6 text-center shadow-sm md:p-8">
            <p className="text-xs font-bold tracking-[0.18em] text-primary">Pricing</p>
            <h1 className="mt-3 text-4xl font-black text-foreground md:text-5xl">Clear pricing at the task level</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              CoTask shows task prices, Secure Payment status, and billing records in context. No hidden marketplace claims or invented earning promises.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {sections.map((section) => (
              <GlassCard key={section.title} className="flex flex-col p-6 md:p-8">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <section.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">{section.title}</h3>
                <ul className="mt-5 flex-1 space-y-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ))}
          </div>

          <div className="mt-10 rounded-lg border border-border bg-secondary/40 p-5 text-center">
            <h2 className="text-base font-semibold">Ready to price a real task?</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
              Create an Open Task, request Direct Hire from a Local Agent, or set your Local Agent rates in onboarding.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <Link to="/PostJob">New Brief</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/FindPeople">Discover Local Agents</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

