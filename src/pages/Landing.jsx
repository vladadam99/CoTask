import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Video, CheckCircle, Search, CreditCard, Building2, Menu, X, MapPin, Eye, Zap, ClipboardCheck, Lock, Star, AlertTriangle, Camera, Home, Car, Hammer, Presentation, ShoppingBag, HelpCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const USE_CASES = [
  { icon: Home, title: 'View a rental property remotely' },
  { icon: Car, title: 'Inspect a used car before buying' },
  { icon: Hammer, title: 'Check on a construction or repair job' },
  { icon: Presentation, title: 'Visit a trade show or event booth' },
  { icon: ShoppingBag, title: 'Run a local errand' },
  { icon: MapPin, title: 'Verify a location, queue, shop, or item' },
  { icon: HelpCircle, title: 'Get live help in another city' },
];

const faqs = [
  { q: 'What is a Local Agent?', a: 'A Local Agent is a verified individual you hire to be physically present at a location when you cannot be there. They act as your eyes and hands on the ground.' },
  { q: 'What tasks can I request?', a: 'You can request anything that requires physical presence: property viewings, vehicle inspections, local errands, checking construction progress, verifying a business, or attending an event.' },
  { q: 'How does live video work?', a: 'Local Agents can stream live video directly from their smartphone to you during a session, allowing you to direct them in real time and see exactly what they see.' },
  { q: 'How are payments handled?', a: 'Payments are held securely in our system when you book a task. The funds are only released to the Local Agent after the task is completed and you have reviewed the proof.' },
  { q: 'Are Local Agents verified?', a: 'Yes. Local Agents undergo identity verification before they can accept tasks, ensuring a trustworthy marketplace.' },
  { q: 'Can I book someone directly?', a: 'Yes. You can browse Local Agents by location or skill and request to hire them directly for your task.' },
  { q: 'Can I post a task and receive proposals?', a: 'Yes. You can post an open task with your requirements, and available Local Agents can submit proposals to complete it.' },
  { q: 'What happens if something goes wrong?', a: 'We offer support tools for disputes. If a task is not completed as agreed, you can raise a dispute, and our admin team will review the evidence to resolve the issue fairly.' },
  { q: 'Can businesses use CoTask?', a: 'Absolutely. CoTask is built for teams needing to coordinate remote inspections, site checks, event visits, and multi-location tasks seamlessly.' },
];

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handlePostTask = () => base44.auth.redirectToLogin('/PostJob');
  const handleBecomeAgent = () => base44.auth.redirectToLogin('/RoleSelect');
  const handleDiscoverAgents = () => base44.auth.redirectToLogin('/FindPeople');

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-inter selection:bg-primary/30">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/92 backdrop-blur-xl border-b border-border/80 shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <button onClick={() => scrollTo('hero')} className="text-xl font-bold tracking-tight">
            Co<span className="text-primary">Task</span>
          </button>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo('how-it-works')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it works</button>
            <button onClick={() => scrollTo('use-cases')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Use Cases</button>
            <button onClick={() => scrollTo('trust')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Trust & Safety</button>
            <button onClick={() => scrollTo('faq')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</button>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" onClick={handleBecomeAgent} className="font-semibold text-muted-foreground hover:text-foreground">
              Become a Local Agent
            </Button>
            <Button onClick={handlePostTask} className="font-semibold">
              Post a Task
            </Button>
          </div>
          <button className="md:hidden p-2 text-muted-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border px-4 py-4 flex flex-col gap-4 shadow-lg absolute top-16 left-0 right-0">
            <button onClick={() => { scrollTo('how-it-works'); setMobileMenuOpen(false); }} className="text-sm font-medium text-left">How it works</button>
            <button onClick={() => { scrollTo('use-cases'); setMobileMenuOpen(false); }} className="text-sm font-medium text-left">Use Cases</button>
            <button onClick={() => { scrollTo('trust'); setMobileMenuOpen(false); }} className="text-sm font-medium text-left">Trust & Safety</button>
            <button onClick={() => { scrollTo('faq'); setMobileMenuOpen(false); }} className="text-sm font-medium text-left">FAQ</button>
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => { handleBecomeAgent(); setMobileMenuOpen(false); }} className="w-full justify-center">
                Become a Local Agent
              </Button>
              <Button onClick={() => { handlePostTask(); setMobileMenuOpen(false); }} className="w-full justify-center">
                Post a Task
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="hero" className="relative min-h-[88vh] flex items-center px-4 pt-24 pb-16 overflow-hidden bg-cover bg-center" style={{ backgroundImage: "linear-gradient(90deg, hsl(222 47% 7% / 0.90) 0%, hsl(222 47% 7% / 0.68) 46%, hsl(222 47% 7% / 0.26) 100%), url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=2400&q=80')" }}>
        <div className="relative z-10 max-w-6xl mx-auto w-full mt-10">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight text-white leading-[1.02]">
              Get trusted eyes on the ground, anywhere.
            </h1>
            <p className="text-base md:text-xl text-white/82 max-w-2xl mb-10 leading-relaxed font-medium">
              Hire a trusted Local Agent to visit, inspect, record, or livestream from anywhere — so you can see and act remotely in real time.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10 max-w-xl">
              <Button size="lg" onClick={handlePostTask} className="w-full sm:w-auto text-base px-8 h-14 shadow-lg shadow-primary/20">
                Post a Task
              </Button>
              <Button size="lg" variant="outline" onClick={handleBecomeAgent} className="w-full sm:w-auto text-base px-8 h-14 border-white/30 bg-white/10 text-white hover:bg-white hover:text-foreground">
                Become a Local Agent
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="grid max-w-3xl gap-3 sm:grid-cols-3">
            <div className="contents text-sm font-semibold text-white">
              <span className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-3 backdrop-blur"><Shield className="w-4 h-4 text-emerald-300" /> Verified agents</span>
              <span className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-3 backdrop-blur"><CreditCard className="w-4 h-4 text-amber-300" /> Secure checkout</span>
              <span className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-3 backdrop-blur"><Video className="w-4 h-4 text-cyan-300" /> Live video proof</span>
            </div>
            <p className="hidden">
              For property viewings, inspections, errands, site visits, events, and anything you need checked remotely.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-4 bg-background scroll-mt-16 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">How CoTask Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Get physical presence anywhere in three simple steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: '1. Post or choose', desc: 'Post a task outlining what you need done, or browse and choose a verified Local Agent directly.' },
              { icon: Lock, title: '2. Agree & Fund securely', desc: 'The Local Agent accepts your request or you choose from proposals. Then fund the task. Secure Payment is held until approval.' },
              { icon: CheckCircle, title: '3. Join & approve', desc: 'Join via live video or review uploaded proof. Once satisfied, approve completion to release payment.' },
            ].map((step, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 mx-auto bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                  <step.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-24 px-4 bg-secondary/30 scroll-mt-16 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Real-world Use Cases</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Practical, remote assistance for when you can't be there yourself.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map((uc, i) => (
              <div key={i} className="bg-background border border-border rounded-xl p-5 flex items-start gap-4 hover:border-primary/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <uc.icon className="w-5 h-5 text-foreground/70" />
                </div>
                <p className="font-semibold text-foreground pt-2">{uc.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Clients & Local Agents (Split Section) */}
      <section className="py-24 px-4 bg-background border-t border-border">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8">
          
          {/* For Clients */}
          <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-sm">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Eye className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold mb-4">For Clients</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Clients use CoTask when they need someone physically present somewhere they cannot be.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                'Find verified Local Agents globally',
                'Request a direct hire or post an open task',
                'Chat before the session starts',
                'Join live video for real-time direction',
                'Receive proof and recordings if available',
                'Pay securely and review the result'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-4">
              <Button onClick={handlePostTask} className="bg-blue-600 hover:bg-blue-700 text-white">Post a Task</Button>
              <Button variant="outline" onClick={handleDiscoverAgents}>Discover Local Agents</Button>
            </div>
          </div>

          {/* For Local Agents */}
          <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-sm">
            <div className="w-12 h-12 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold mb-4">For Local Agents</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Local Agents earn money by helping clients remotely with real-world tasks in their area.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                'Create a public profile',
                'Verify your identity',
                'Receive direct requests from clients',
                'Submit proposals for open tasks',
                'Stream live from your phone or camera',
                'Upload proof and get paid for completed work'
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">{item}</span>
                </li>
              ))}
            </ul>
            <Button onClick={handleBecomeAgent} className="bg-green-600 hover:bg-green-700 text-white px-8">
              Become a Local Agent
            </Button>
          </div>

        </div>
      </section>

      {/* Trust & Safety */}
      <section id="trust" className="py-24 px-4 bg-secondary/30 border-y border-border scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Trust, Safety, and Verification</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">We've built a secure environment so you can hire and work with confidence.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Built for verified profiles', desc: 'Identity verification processes ensure you know who you are working with.' },
              { icon: Lock, title: 'Secure payment flow', desc: 'Funds are securely held and only released upon successful task completion.' },
              { icon: Camera, title: 'Live video proof', desc: 'Real-time video streaming provides irrefutable proof of physical presence.' },
              { icon: Star, title: 'Reviews after completed tasks', desc: 'A transparent rating system builds accountability for both clients and agents.' },
              { icon: ClipboardCheck, title: 'Task history tracking', desc: 'A clear record of all communications, milestones, and proofs for every task.' },
              { icon: AlertTriangle, title: 'Support tools for disputes', desc: 'Admin oversight and reporting tools are available to handle any issues fairly.' },
            ].map((item, i) => (
              <div key={i} className="bg-background border border-border rounded-2xl p-6">
                <item.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Teaser */}
      <section className="py-20 px-4 bg-foreground text-background">
        <div className="max-w-4xl mx-auto text-center">
          <Building2 className="w-12 h-12 mx-auto text-primary mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">For Teams and Businesses</h2>
          <p className="text-xl text-background/80 mb-10 max-w-2xl mx-auto">
            Coordinate remote inspections, site checks, event visits, and multi-location tasks with verified Local Agents worldwide.
          </p>
          <Link to="/Contact">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8">
              Contact Sales
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 bg-background scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-6 bg-card">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-primary/5 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6 text-foreground">Ready to get started?</h2>
          <p className="text-xl text-muted-foreground mb-10">Join the remote physical presence marketplace today.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={handlePostTask} className="w-full sm:w-auto px-8 h-14">
              Post a Task
            </Button>
            <Button size="lg" variant="outline" onClick={handleBecomeAgent} className="w-full sm:w-auto px-8 h-14 bg-background">
              Become a Local Agent
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-background">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <button onClick={() => scrollTo('hero')} className="text-xl font-bold">Co<span className="text-primary">Task</span></button>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-muted-foreground">
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-foreground">How it works</button>
            <button onClick={() => scrollTo('use-cases')} className="hover:text-foreground">Use Cases</button>
            <Link to="/Safety" className="hover:text-foreground">Safety</Link>
            <Link to="/Contact" className="hover:text-foreground">Contact</Link>
            <Link to="/Terms" className="hover:text-foreground">Terms</Link>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 CoTask. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}