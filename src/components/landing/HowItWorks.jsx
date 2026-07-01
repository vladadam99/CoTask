import React from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Search, Video } from 'lucide-react';

const steps = [
  { n: '01', icon: Search, title: 'Find or post', desc: 'Browse Local Agents or publish an Open Task with the location, timing, budget, and requirements.' },
  { n: '02', icon: CalendarCheck, title: 'Agree and fund', desc: 'Choose a proposal or send Direct Hire. When required, fund Secure Payment before the task starts.' },
  { n: '03', icon: Video, title: 'Watch and approve', desc: 'Use live video when available, review proof, approve completion, or raise an issue if something needs review.' },
];

export default function HowItWorks() {
  return (
    <section className="border-t border-border bg-background px-6 py-24 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">Task flow</p>
          <h2 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">
            Clear from request to review.
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="surface-panel rounded-lg p-6 md:p-8"
            >
              <div className="mb-5 text-5xl font-black text-primary/10">{step.n}</div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
