import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, DollarSign, Shield, TrendingUp } from 'lucide-react';

const perks = [
  { icon: DollarSign, title: 'Set your own rates', desc: 'Choose hourly or fixed task pricing where supported.' },
  { icon: Clock, title: 'Flexible schedule', desc: 'Accept tasks that fit your availability.' },
  { icon: Shield, title: 'Build profile trust', desc: 'Use services, reviews, proof, and verification status where available.' },
  { icon: TrendingUp, title: 'Grow your work history', desc: 'Completed tasks and clear proof help clients evaluate your profile.' },
];

export default function AvatarEarnings() {
  return (
    <section className="border-t border-border bg-card px-6 py-24 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-primary">Earn with CoTask</p>
            <h2 className="mb-6 text-4xl font-black tracking-tight text-foreground md:text-5xl">
              Turn local availability into task work.
            </h2>
            <p className="mb-8 max-w-sm text-muted-foreground">
              Help clients remotely by being their eyes, hands, and guide on the ground.
            </p>
            <div className="mb-8 rounded-lg border border-border bg-secondary/40 p-5">
              <p className="text-sm font-semibold text-foreground">Earnings are task based</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Set your rate, complete tasks, review release status, and save payout preferences for Production V1 manual review.
              </p>
            </div>
            <Link to="/Onboarding?role=avatar">
              <button className="group flex items-center gap-3 rounded-lg bg-primary px-8 py-4 font-bold text-primary-foreground transition-all hover:bg-primary/90">
                Become a Local Agent
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {perks.map((perk, i) => (
              <motion.div key={perk.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="surface-panel rounded-lg p-6 transition-colors hover:border-primary/30">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <perk.icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="mb-2 text-sm font-bold text-foreground">{perk.title}</h4>
                <p className="text-xs leading-relaxed text-muted-foreground">{perk.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
