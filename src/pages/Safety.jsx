import React from 'react';
import InfoPageHeader from '@/components/layout/InfoPageHeader';
import Footer from '@/components/landing/Footer';
import GlassCard from '@/components/ui/GlassCard';
import { AlertTriangle, Eye, Lock, Shield, Star, UserCheck } from 'lucide-react';

const features = [
  { icon: UserCheck, title: 'Profile verification', desc: 'Verification workflows and profile status are shown where available so clients can review trust context before hiring.' },
  { icon: Shield, title: 'Secure Payment', desc: 'Funds are held for supported tasks and released after client approval or a reviewed resolution.' },
  { icon: Star, title: 'Reviews and ratings', desc: 'Clients and Local Agents can leave reviews after completed work, helping future users compare profiles.' },
  { icon: Eye, title: 'Task records', desc: 'Messages, task status, proof uploads, timestamps, and live-session context help both sides understand what happened.' },
  { icon: Lock, title: 'Privacy controls', desc: 'Account and task data should stay inside the app unless a workflow explicitly asks you to share it.' },
  { icon: AlertTriangle, title: 'Issue reporting', desc: 'If a task needs review, users can raise an issue and keep the evidence tied to the task record.' },
];

export default function Safety() {
  return (
    <div className="min-h-screen bg-background">
      <InfoPageHeader />
      <main className="px-6 pb-20 pt-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 rounded-lg border border-border bg-card p-6 text-center shadow-sm md:p-8">
            <Shield className="mx-auto mb-4 h-12 w-12 text-primary" />
            <p className="text-xs font-bold tracking-[0.18em] text-primary">Safety</p>
            <h1 className="mt-3 text-4xl font-black text-foreground">Trust & Safety</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              CoTask is designed around clear profiles, task records, proof, payments, and issue review.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <GlassCard key={feature.title} className="p-6">
                <feature.icon className="mb-4 h-6 w-6 text-primary" />
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
