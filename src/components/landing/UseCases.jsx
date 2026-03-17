import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { MapPin, Home, ShoppingBag, Users, Building2, GraduationCap, Heart, Globe, Briefcase } from 'lucide-react';

const userCases = [
  { icon: MapPin, title: 'Live City Guide', desc: 'Explore a new city with a local avatar walking you through markets, streets, and hidden gems.' },
  { icon: Home, title: 'Property Walkthrough', desc: 'View apartments, homes, or offices in real time before you travel or commit.' },
  { icon: ShoppingBag, title: 'Shopping Assistance', desc: 'Send an avatar to shop, compare, and show you options live from any store.' },
];

const bizCases = [
  { icon: Building2, title: 'Remote Site Inspection', desc: 'Get live visual inspections of construction sites, offices, and facilities anywhere.' },
  { icon: GraduationCap, title: 'Field Training Support', desc: 'Guide remote teams with live walkthroughs and real-time on-site coaching.' },
  { icon: Briefcase, title: 'Client Demos & Visits', desc: 'Show products, venues, and locations to clients without flying anyone out.' },
];

function CaseCard({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <GlassCard className="p-6 h-full" hover>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
          <item.icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold mb-2">{item.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
      </GlassCard>
    </motion.div>
  );
}

export default function UseCases() {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-background via-card/30 to-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What can you do with CoTask?</h2>
          <p className="text-muted-foreground text-lg">Real people, real places, real time</p>
        </div>
        
        <div className="mb-12">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> For Individuals
          </h3>
          <div className="grid md:grid-cols-3 gap-5">
            {userCases.map((item, i) => <CaseCard key={item.title} item={item} index={i} />)}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" /> For Businesses
          </h3>
          <div className="grid md:grid-cols-3 gap-5">
            {bizCases.map((item, i) => <CaseCard key={item.title} item={item} index={i} />)}
          </div>
        </div>
      </div>
    </section>
  );
}