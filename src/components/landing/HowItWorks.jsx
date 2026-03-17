import React from 'react';
import { motion } from 'framer-motion';
import { Search, UserCheck, Video } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

const steps = [
  {
    icon: Search,
    title: 'Discover',
    description: 'Browse verified avatars by category, location, language, and availability. Find the perfect match for your need.',
  },
  {
    icon: UserCheck,
    title: 'Book & Connect',
    description: 'Schedule instantly or pick a time. Share your instructions, location, and preferences. Your avatar gets ready.',
  },
  {
    icon: Video,
    title: 'Go Live',
    description: 'Join a live session in real time. Your avatar is your eyes, hands, and guide — right where you need them.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How CoTask works</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Three simple steps to real-world remote presence
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <GlassCard className="p-8 text-center h-full">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-xs font-medium text-primary mb-2">Step {i + 1}</div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}