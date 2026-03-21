import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section className="py-28 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden bg-primary p-16 text-center"
        >
          {/* Background texture */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-red-700 opacity-100" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-5">Get started today</p>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-6">
              Your avatar is<br />waiting for you.
            </h2>
            <p className="text-white/70 mb-10 max-w-md mx-auto text-lg">
              Join the platform where real people connect across real places, in real time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/Explore">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold px-10 h-13 text-base">
                  Find an Avatar <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/Onboarding?role=avatar">
                <Button size="lg" className="bg-transparent border-2 border-white/40 hover:border-white hover:bg-white/10 text-white px-10 h-13 text-base font-semibold transition-all">
                  Become an Avatar
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}