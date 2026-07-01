import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Building2, GraduationCap, Home, MapPin, ShoppingBag } from 'lucide-react';

const cases = {
  personal: [
    { icon: MapPin, title: 'City guide', tag: 'Travel', desc: 'Ask a Local Agent to show a place live or capture details before you arrive.' },
    { icon: Home, title: 'Property tour', tag: 'Real estate', desc: 'Review an apartment, room, office, or neighbourhood remotely before committing.' },
    { icon: ShoppingBag, title: 'Shopping help', tag: 'Errands', desc: 'Compare local items, verify condition, or coordinate a pickup through messages.' },
  ],
  business: [
    { icon: Building2, title: 'Site inspection', tag: 'Operations', desc: 'Get remote visual checks of offices, stores, venues, and project locations.' },
    { icon: GraduationCap, title: 'Field support', tag: 'Training', desc: 'Guide someone on-site while keeping task proof and messages in one place.' },
    { icon: Briefcase, title: 'Client demos', tag: 'Sales', desc: 'Show a product, venue, or location to a client without sending your team.' },
  ],
};

export default function UseCases() {
  const [tab, setTab] = useState('personal');

  return (
    <section className="border-t border-border bg-secondary/30 px-6 py-24 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">Use cases</p>
            <h2 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">
              Practical help when you cannot be there.
            </h2>
          </div>

          <div className="flex self-start rounded-full border border-border bg-card p-1 md:self-auto">
            <button onClick={() => setTab('personal')}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${tab === 'personal' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              Personal
            </button>
            <button onClick={() => setTab('business')}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${tab === 'business' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              Business
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
            className="grid gap-5 md:grid-cols-3">
            {cases[tab].map((item) => (
              <div key={item.title} className="surface-panel rounded-lg p-6 transition-all hover:border-primary/30 md:p-8">
                <div className="mb-8 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">{item.tag}</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
