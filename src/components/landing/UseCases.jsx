import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Home, ShoppingBag, Building2, GraduationCap, Briefcase } from 'lucide-react';

const cases = {
  personal: [
    { icon: MapPin, title: 'City Guide', tag: 'Travel', desc: 'Explore any city with a local avatar walking you through streets, markets, and hidden gems — live.' },
    { icon: Home, title: 'Property Tour', tag: 'Real Estate', desc: 'View apartments or offices in real time before you travel or commit.' },
    { icon: ShoppingBag, title: 'Shopping Help', tag: 'Errands', desc: 'Send an avatar to shop, compare, and show you options live from any store.' },
  ],
  business: [
    { icon: Building2, title: 'Site Inspection', tag: 'Operations', desc: 'Get live visual inspections of construction sites, offices, and facilities anywhere.' },
    { icon: GraduationCap, title: 'Field Training', tag: 'HR & Training', desc: 'Guide remote teams with live walkthroughs and real-time on-site coaching.' },
    { icon: Briefcase, title: 'Client Demos', tag: 'Sales', desc: 'Show products, venues, and locations to clients without flying anyone out.' },
  ],
};

export default function UseCases() {
  const [tab, setTab] = useState('personal');

  return (
    <section className="py-32 px-6 lg:px-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-5">Use cases</p>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white leading-tight">
              What will you<br />use it for?
            </h2>
          </div>

          {/* Toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-full p-1 self-start md:self-auto">
            <button onClick={() => setTab('personal')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${tab === 'personal' ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>
              Personal
            </button>
            <button onClick={() => setTab('business')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${tab === 'business' ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>
              Business
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
            className="grid md:grid-cols-3 gap-5">
            {cases[tab].map((item, i) => (
              <div key={item.title} className="group rounded-3xl border border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15 transition-all duration-300 p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-white/30 border border-white/10 rounded-full px-3 py-1">{item.tag}</span>
                </div>
                <h3 className="text-xl font-black text-white mb-3">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}