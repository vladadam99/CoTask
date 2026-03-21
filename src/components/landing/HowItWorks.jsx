import React from 'react';
import { motion } from 'framer-motion';
import { Search, CalendarCheck, Video } from 'lucide-react';

const steps = [
  { n: '01', icon: Search, title: 'Find', desc: 'Browse verified avatars by location, category, and availability. Filter by language, rating, and price.' },
  { n: '02', icon: CalendarCheck, title: 'Book', desc: 'Reserve instantly or schedule ahead. Payment is held securely until your job is done.' },
  { n: '03', icon: Video, title: 'Go Live', desc: 'Connect via private live video. Your avatar is your real-world presence — anywhere on earth.' },
];

export default function HowItWorks() {
  return (
    <section className="py-32 px-6 lg:px-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-20">
          <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-5">How it works</p>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white leading-tight">
            Simple as<br />ordering a ride.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
          {steps.map((step, i) => (
            <motion.div key={step.n} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="md:px-12 first:pl-0 last:pr-0 py-10 md:py-0">
              <div className="text-8xl font-black text-white/5 leading-none mb-6">{step.n}</div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">{step.title}</h3>
              <p className="text-white/40 leading-relaxed text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}