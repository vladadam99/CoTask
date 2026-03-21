import React from 'react';
import { motion } from 'framer-motion';
import { Search, CalendarCheck, Video } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Find your Avatar',
    description: 'Browse verified avatars by location, category, language, and availability. Read reviews, check rates, and pick your match.',
  },
  {
    number: '02',
    icon: CalendarCheck,
    title: 'Book instantly',
    description: 'Schedule now or for later. Share your task, location, and any special instructions. Payment is held securely until completion.',
  },
  {
    number: '03',
    icon: Video,
    title: 'Go live, remotely',
    description: 'Join a private live video session. Your avatar becomes your presence — eyes, hands, and guide anywhere in the world.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-28 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-4">How it works</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight max-w-lg">
              Three steps to<br />remote presence
            </h2>
            <p className="text-muted-foreground max-w-xs">
              Simple, fast, and secure. Get started in minutes.
            </p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-background p-10 group hover:bg-card/60 transition-colors duration-300"
            >
              <div className="text-6xl font-black text-white/5 group-hover:text-white/8 transition-colors mb-6 leading-none">
                {step.number}
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}