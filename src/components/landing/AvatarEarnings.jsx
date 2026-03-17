import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { DollarSign, Clock, Shield, Star } from 'lucide-react';

const perks = [
  { icon: DollarSign, title: 'Set your own rates', desc: 'Choose hourly or per-session pricing. You decide what your time is worth.' },
  { icon: Clock, title: 'Flexible schedule', desc: 'Work when you want. Accept bookings that fit your availability.' },
  { icon: Shield, title: 'Verified & trusted', desc: 'Build your reputation with verified badges and real client reviews.' },
  { icon: Star, title: 'Grow your brand', desc: 'Get featured, earn top-rated status, and attract premium clients.' },
];

export default function AvatarEarnings() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Earn with CoTask</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Become a CoTask Avatar
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Turn your local presence into income. Help people remotely by being their eyes, 
              hands, and guide. All you need is a smartphone and willingness to help.
            </p>
            <Link to="/RoleSelect">
              <Button className="bg-primary hover:bg-primary/90 glow-primary-sm">
                Start earning today
              </Button>
            </Link>
          </motion.div>
          
          <div className="grid grid-cols-2 gap-4">
            {perks.map((perk, i) => (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-xl p-5"
              >
                <perk.icon className="w-5 h-5 text-primary mb-3" />
                <h4 className="font-medium text-sm mb-1">{perk.title}</h4>
                <p className="text-xs text-muted-foreground">{perk.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}