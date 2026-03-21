import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section className="py-32 px-6 lg:px-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative rounded-[2.5rem] overflow-hidden bg-primary p-16 md:p-24">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-red-700" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-black/20 rounded-full" />
          <div className="absolute inset-0 opacity-5"
            style={{backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '40px 40px'}}
          />

          <div className="relative z-10 text-center">
            <p className="text-white/60 text-xs font-bold uppercase tracking-[0.25em] mb-6">Get started</p>
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] mb-8">
              Your avatar<br />is waiting.
            </h2>
            <p className="text-white/60 text-xl mb-12 max-w-sm mx-auto leading-relaxed">
              Real presence. Anywhere. Right now.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/Explore">
                <button className="group flex items-center gap-3 bg-white text-black font-bold text-base px-10 py-4 rounded-full hover:bg-white/90 transition-all w-full sm:w-auto justify-center">
                  Find an Avatar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link to="/Onboarding?role=avatar">
                <button className="flex items-center justify-center gap-3 border-2 border-white/30 hover:border-white text-white font-bold text-base px-10 py-4 rounded-full hover:bg-white/10 transition-all w-full sm:w-auto">
                  Become an Avatar
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}