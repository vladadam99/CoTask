import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Clock, Shield, TrendingUp, ArrowRight } from 'lucide-react';

const perks = [
  { icon: DollarSign, title: 'Set your own rates', desc: 'Hourly or per-session. Your time, your price.' },
  { icon: Clock, title: 'Flexible schedule', desc: 'Accept bookings that fit your life. No minimum hours.' },
  { icon: Shield, title: 'Verified & safe', desc: 'Get a verified badge and grow your reputation with real reviews.' },
  { icon: TrendingUp, title: 'Grow your income', desc: 'Get featured and earn top-rated status to attract premium clients.' },
];

export default function AvatarEarnings() {
  return (
    <section className="py-32 px-6 lg:px-12 border-t border-white/5 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-24 items-center">

          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-5">Earn with CoTask</p>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white leading-tight mb-8">
              Turn your city<br />into income.
            </h2>
            <p className="text-white/40 text-lg leading-relaxed mb-10 max-w-sm">
              All you need is a smartphone. Help people remotely by being their eyes, hands, and guide.
            </p>

            {/* Earnings stat block */}
            <div className="border border-white/10 rounded-3xl p-8 mb-10 bg-white/3">
              <p className="text-white/40 text-sm mb-2">Top avatars earn</p>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-6xl font-black text-white">$1,200</span>
                <span className="text-white/30 text-xl mb-2">/mo</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '78%' }} />
                </div>
                <span className="text-green-400 text-xs font-semibold">↑ 24% this quarter</span>
              </div>
            </div>

            <Link to="/Onboarding?role=avatar">
              <button className="group flex items-center gap-3 bg-primary text-white font-bold px-8 py-4 rounded-full hover:bg-primary/90 transition-all">
                Start earning today
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </motion.div>

          {/* Right: perks */}
          <div className="grid grid-cols-2 gap-4">
            {perks.map((perk, i) => (
              <motion.div key={perk.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-3xl border border-white/8 bg-white/3 p-6 hover:bg-white/6 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <perk.icon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-bold text-white text-sm mb-2">{perk.title}</h4>
                <p className="text-white/40 text-xs leading-relaxed">{perk.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}