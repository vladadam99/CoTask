import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Shield, Globe, ArrowRight, Menu, X, Video, TrendingUp, MapPin, Home, ShoppingBag, Plane, Wrench, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STATS = [
  { value: '12K+', label: 'Active Avatars' },
  { value: '98%', label: 'Satisfaction' },
  { value: '180+', label: 'Countries' },
  { value: '$2.4M', label: 'Paid Out' },
];

const CATEGORIES = [
  { icon: MapPin, label: 'City Tours', color: 'text-blue-400' },
  { icon: Home, label: 'Property', color: 'text-green-400' },
  { icon: ShoppingBag, label: 'Shopping', color: 'text-pink-400' },
  { icon: Plane, label: 'Travel', color: 'text-sky-400' },
  { icon: Wrench, label: 'Repair', color: 'text-orange-400' },
  { icon: Building2, label: 'Business', color: 'text-purple-400' },
];

const USE_CASES = [
  {
    icon: Globe,
    title: 'Virtual Travel',
    desc: 'Explore any city live through a local guide with a 360° camera. Walk the streets, visit markets, see everything in real time.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Shield,
    title: 'Property Inspection',
    desc: 'View properties remotely with a live walkthrough. Get all the details before committing, from anywhere in the world.',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    icon: Zap,
    title: 'Instant Errands',
    desc: 'Need someone on the ground right now? Book an available avatar for queue, pickup, or any real-world task instantly.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleGetStarted = () => base44.auth.redirectToLogin('/RoleSelect');

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-strong border-b border-white/5' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">
            Co<span className="text-primary">Task</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/HowItWorks" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</Link>
            <Link to="/Pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          </div>
          <button
            onClick={handleGetStarted}
            className="hidden md:flex px-5 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-all glow-primary-sm items-center gap-2"
          >
            Let's Go <ArrowRight className="w-4 h-4" />
          </button>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden glass-strong border-b border-white/5 px-4 py-4 flex flex-col gap-4">
            <Link to="/HowItWorks" className="text-sm" onClick={() => setMobileMenuOpen(false)}>How it works</Link>
            <Link to="/Pricing" className="text-sm" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <button onClick={() => { handleGetStarted(); setMobileMenuOpen(false); }} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg text-left flex items-center gap-2">
              Let's Go <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-blue-500/8 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary">Live sessions happening now worldwide</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight tracking-tight">
              Be there{' '}
              <span className="text-gradient">without</span>
              <br />being there
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Book a local avatar for live-streamed tours, inspections, errands, and real-time presence — anywhere in the world, instantly.
            </p>
          </motion.div>

          <div className="flex justify-center mb-12">
            <button
              onClick={handleGetStarted}
              className="px-12 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl glow-primary transition-all text-lg flex items-center gap-3 hover:scale-105"
            >
              <Zap className="w-5 h-5" /> Let's Go
            </button>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            {STATS.map(stat => (
              <div key={stat.label} className="glass rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Available Now</h2>
            <p className="text-muted-foreground">Real people ready to stream for you right now</p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {CATEGORIES.map(cat => (
              <span key={cat.label} className="px-5 py-2 glass border border-white/5 hover:border-white/15 rounded-full text-sm flex items-center gap-2 transition-all">
                <cat.icon className={`w-4 h-4 ${cat.color}`} /> {cat.label}
              </span>
            ))}
          </div>
          <div className="text-center">
            <button onClick={handleGetStarted} className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary rounded-xl font-medium transition-all">
              Explore all avatars <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">How CoTask Works</h2>
            <p className="text-muted-foreground">Three steps to your live remote experience</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: '01', title: 'Find an Avatar', desc: 'Search by category, location or availability. See real ratings and live previews before you book.' },
              { n: '02', title: 'Book & Connect', desc: 'Schedule ahead or book instantly. Pay securely and get connected via live stream with your avatar.' },
              { n: '03', title: 'Experience Live', desc: "Direct your avatar in real time. They're your eyes, hands, and guide — wherever you need them." },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-8"
              >
                <span className="text-4xl font-black text-primary/30 mb-4 block">{step.n}</span>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">What People Use CoTask For</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {USE_CASES.map((uc, i) => (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-8"
              >
                <div className={`w-12 h-12 rounded-2xl ${uc.bg} flex items-center justify-center mb-5`}>
                  <uc.icon className={`w-6 h-6 ${uc.color}`} />
                </div>
                <h3 className="text-lg font-bold mb-3">{uc.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{uc.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Avatar Earnings CTA */}
      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-10 md:p-14 border border-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">Top avatars earn $3,000+/month</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Earn by Being Someone's Avatar</h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
                Use your local knowledge, your camera, and your presence to earn money helping people remotely. Set your own schedule and rates.
              </p>
              <button onClick={handleGetStarted} className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl glow-primary transition-all">
                <Video className="w-5 h-5" /> Become an Avatar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="text-xl font-bold">Co<span className="text-primary">Task</span></Link>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <Link to="/HowItWorks" className="hover:text-foreground transition-colors">How it works</Link>
              <Link to="/Pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/Safety" className="hover:text-foreground transition-colors">Safety</Link>
              <Link to="/FAQ" className="hover:text-foreground transition-colors">FAQ</Link>
              <Link to="/Contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 CoTask. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}