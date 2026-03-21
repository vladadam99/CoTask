import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { DollarSign, Clock, Shield, TrendingUp, ArrowRight } from 'lucide-react';

const perks = [
  { icon: DollarSign, title: 'Set your own rates', desc: 'Hourly or per-session. You decide what your time is worth.' },
  { icon: Clock, title: 'Flexible hours', desc: 'Work when you want. Accept only the bookings that fit you.' },
  { icon: Shield, title: 'Verified & trusted', desc: 'Get a verified badge and grow your reputation with reviews.' },
  { icon: TrendingUp, title: 'Grow your income', desc: 'Get featured, earn top-rated status, attract premium clients.' },
];

export default function AvatarEarnings() {
  return (
    <section className="py-28 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-4">Earn with CoTask</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-6">
              Turn your<br />location into<br />income.
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed max-w-sm">
              Help people remotely by being their eyes, hands, and guide. All you need is a smartphone and a willingness to help.
            </p>

            {/* Earning highlight */}
            <div className="glass rounded-2xl p-6 mb-8 border border-white/10">
              <p className="text-xs text-muted-foreground mb-1">Avg. avatar earns</p>
              <p className="text-4xl font-black text-foreground">$800<span className="text-muted-foreground text-xl font-normal">/mo</span></p>
              <p className="text-xs text-green-400 mt-1">↑ 24% vs last quarter</p>
            </div>

            <Link to="/Onboarding?role=avatar">
              <Button className="bg-primary hover:bg-primary/90 glow-primary-sm h-12 px-8 font-semibold">
                Start earning today <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Right: perks grid */}
          <div className="grid grid-cols-2 gap-4">
            {perks.map((perk, i) => (
              <motion.div
                key={perk.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <perk.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-bold text-sm mb-1.5">{perk.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{perk.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}