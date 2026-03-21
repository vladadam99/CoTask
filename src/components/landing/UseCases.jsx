import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Home, ShoppingBag, Building2, GraduationCap, Briefcase } from 'lucide-react';

const tabs = ['For Individuals', 'For Business'];

const cases = {
  'For Individuals': [
    {
      icon: MapPin,
      title: 'Live City Guide',
      desc: 'Explore any city with a local avatar — markets, streets, hidden gems, all in real time.',
      tag: 'Travel',
    },
    {
      icon: Home,
      title: 'Property Walkthrough',
      desc: 'View apartments, homes, or offices before you travel or commit. No surprises.',
      tag: 'Real Estate',
    },
    {
      icon: ShoppingBag,
      title: 'Shopping Assistance',
      desc: 'Send an avatar to shop, compare, and show you live from any store, anywhere.',
      tag: 'Shopping',
    },
  ],
  'For Business': [
    {
      icon: Building2,
      title: 'Remote Site Inspection',
      desc: 'Get live visual inspections of construction sites, offices, and facilities anywhere.',
      tag: 'Operations',
    },
    {
      icon: GraduationCap,
      title: 'Field Training',
      desc: 'Guide remote teams with live walkthroughs and real-time on-site coaching sessions.',
      tag: 'Training',
    },
    {
      icon: Briefcase,
      title: 'Client Demos & Visits',
      desc: 'Showcase products, venues, and locations to clients — no flights required.',
      tag: 'Sales',
    },
  ],
};

export default function UseCases() {
  const [activeTab, setActiveTab] = useState('For Individuals');
  const items = cases[activeTab];

  return (
    <section className="py-28 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-4">Use cases</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              What will you<br />do with CoTask?
            </h2>
            {/* Tab switcher */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-full border border-white/10 self-start">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group glass rounded-2xl p-7 hover:bg-card/80 transition-all duration-300 border border-white/5 hover:border-white/10"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground border border-white/10 rounded-full px-3 py-1">
                  {item.tag}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}