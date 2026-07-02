import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Eye,
  FileText,
  Home,
  MapPin,
  Menu,
  MessageSquare,
  PlayCircle,
  Search,
  ShieldCheck,
  Smartphone,
  UserRoundCheck,
  Users,
  Video,
  X,
  Zap,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=2400&q=82';

const quickPaths = [
  {
    icon: Search,
    label: 'Clients',
    title: 'Find someone local',
    text: 'Book a trusted Local Agent, post an open task, or join a live session when the work starts.',
    action: 'Find a Local Agent',
    path: '/Explore',
    accent: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: Zap,
    label: 'Local Agents',
    title: 'Earn from nearby tasks',
    text: 'Browse open work, send proposals, accept direct requests, and deliver proof from your phone.',
    action: 'Become an Agent',
    path: '/Onboarding?role=avatar',
    accent: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: Building2,
    label: 'Enterprise',
    title: 'Run field work remotely',
    text: 'Coordinate inspections, site checks, event visits, and repeat multi-location workflows.',
    action: 'Set Up Team',
    path: '/Onboarding?role=enterprise',
    accent: 'text-amber-700 bg-amber-500/10 border-amber-500/20',
  },
];

const proofFlow = [
  { icon: FileText, label: 'Task brief', text: 'Clear scope, location, budget, and timing.' },
  { icon: MessageSquare, label: 'Conversation', text: 'Client and Local Agent agree details before work.' },
  { icon: Video, label: 'Live or proof', text: 'Join live video or review photos, notes, and updates.' },
  { icon: CreditCard, label: 'Secure Payment', text: 'Checkout handoff happens before chargeable work starts.' },
];

const useCases = [
  { icon: Home, title: 'Property walkthrough', detail: 'View a rental, room, shop, or office remotely.' },
  { icon: Camera, title: 'Condition check', detail: 'Inspect a vehicle, product, repair, or local listing.' },
  { icon: MapPin, title: 'Local verification', detail: 'Confirm a queue, address, venue, storefront, or item.' },
  { icon: Briefcase, title: 'Business field task', detail: 'Send a Local Agent for repeat operational checks.' },
];

const trustItems = [
  'Profiles, reviews, and task history help clients choose.',
  'Messages and notifications keep each side in the same workflow.',
  'Live sessions can appear as public live posts when started publicly.',
  'Smartphone video is supported now; 360 camera and smart glasses support are planned.',
];

const faqs = [
  {
    q: 'What is CoTask?',
    a: 'CoTask connects clients and businesses with Local Agents who can physically visit a place, livestream, collect proof, or complete a local task.',
  },
  {
    q: 'Can I post a task instead of choosing an agent?',
    a: 'Yes. Post an Open Task with the essentials, then compare proposals and continue the conversation with the Local Agent you choose.',
  },
  {
    q: 'What happens when an agent goes live?',
    a: 'Private task live sessions stay connected to the client conversation and Live Sessions. Public live sessions can surface in the public feed experience.',
  },
  {
    q: 'Does CoTask charge me immediately?',
    a: 'The app hands off to Secure Payment checkout when funding is needed. This pass keeps the flow up to checkout without making a hidden charge.',
  },
];

const scrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goToApp = (path) => base44.auth.redirectToLogin(path);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-primary/20">
      <nav
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-200 ${
          scrolled
            ? 'border-border bg-background/95 text-foreground shadow-sm backdrop-blur-xl'
            : 'border-white/10 bg-black/10 text-white backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-black tracking-tight">
            Co<span className="text-primary">Task</span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <button onClick={() => scrollTo('start')} className="text-sm font-semibold opacity-80 transition hover:opacity-100">
              Start
            </button>
            <button onClick={() => scrollTo('flow')} className="text-sm font-semibold opacity-80 transition hover:opacity-100">
              Flow
            </button>
            <button onClick={() => scrollTo('use-cases')} className="text-sm font-semibold opacity-80 transition hover:opacity-100">
              Use cases
            </button>
            <Link to="/Pricing" className="text-sm font-semibold opacity-80 transition hover:opacity-100">
              Pricing
            </Link>
            <Link to="/FAQ" className="text-sm font-semibold opacity-80 transition hover:opacity-100">
              FAQ
            </Link>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Button
              variant={scrolled ? 'ghost' : 'outline'}
              onClick={() => goToApp('/FindPeople')}
              className={scrolled ? 'font-semibold' : 'border-white/25 bg-white/10 text-white hover:bg-white hover:text-foreground'}
            >
              Sign in
            </Button>
            <Button onClick={() => goToApp('/PostJob')} className="font-semibold">
              Post a Task
            </Button>
          </div>

          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-current/15 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-border bg-background px-4 py-4 text-foreground shadow-xl md:hidden">
            <div className="grid gap-2 text-sm font-semibold">
              {[
                ['Start', 'start'],
                ['Flow', 'flow'],
                ['Use cases', 'use-cases'],
              ].map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => {
                    scrollTo(id);
                    setMenuOpen(false);
                  }}
                  className="rounded-lg px-3 py-3 text-left hover:bg-secondary"
                >
                  {label}
                </button>
              ))}
              <Link to="/Pricing" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-secondary">
                Pricing
              </Link>
              <Link to="/FAQ" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-secondary">
                FAQ
              </Link>
            </div>
            <div className="mt-4 grid gap-2 border-t border-border pt-4">
              <Button variant="outline" onClick={() => goToApp('/FindPeople')}>
                Sign in
              </Button>
              <Button onClick={() => goToApp('/PostJob')}>Post a Task</Button>
            </div>
          </div>
        )}
      </nav>

      <section
        id="hero"
        className="relative flex min-h-[68svh] items-center bg-cover bg-center px-4 pb-8 pt-20 sm:px-6 md:min-h-[82svh] md:pb-10 md:pt-24 lg:px-8"
        style={{
          backgroundImage: `linear-gradient(90deg, hsl(222 47% 7% / 0.92) 0%, hsl(222 47% 7% / 0.74) 48%, hsl(222 47% 7% / 0.28) 100%), url(${HERO_IMAGE})`,
        }}
      >
        <div className="mx-auto w-full max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
              <Eye className="h-3.5 w-3.5 text-cyan-200" />
              Live local help
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Remote task help with live Local Agents.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-white/80 md:text-xl">
              Book someone trusted to be there for you. CoTask brings open tasks, direct hire, live video, proof, messages, and Secure Payment into one clear flow.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => goToApp('/Explore')} className="h-12 justify-center gap-2 px-7 text-base md:h-14">
                Find a Local Agent <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => goToApp('/PostJob')}
                className="h-12 justify-center border-white/30 bg-white/10 px-7 text-base text-white hover:bg-white hover:text-foreground md:h-14"
              >
                Post an Open Task
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-semibold text-white/75">
              <button onClick={() => goToApp('/Onboarding?role=avatar')} className="inline-flex items-center gap-1.5 transition hover:text-white">
                Become a Local Agent <ChevronRight className="h-4 w-4" />
              </button>
              <span className="hidden h-1 w-1 rounded-full bg-white/40 sm:block" />
              <button onClick={() => goToApp('/Onboarding?role=enterprise')} className="inline-flex items-center gap-1.5 transition hover:text-white">
                Enterprise setup <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

          <div className="mt-8 hidden max-w-3xl grid-cols-3 gap-3 md:grid">
            {[
              ['Live video', Video],
              ['Task proof', CheckCircle2],
              ['Secure handoff', CreditCard],
            ].map(([label, Icon]) => (
              <div key={label} className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur">
                <Icon className="mb-2 h-4 w-4 text-cyan-200" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="start" className="relative z-10 border-b border-border bg-background px-4 py-16 scroll-mt-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Choose your path</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
              One homepage. Three clean ways in.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              The app should not feel like a maze. Start with what you are trying to do, then move directly into the matching workflow.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {quickPaths.map((item, index) => (
                <motion.button
                  key={item.label}
                  type="button"
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                  onClick={() => goToApp(item.path)}
                  className="surface-panel glass-hover rounded-lg p-5 text-left"
                >
                  <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg border ${item.accent}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                  <h3 className="mt-2 text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="mt-3 min-h-[72px] text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                    {item.action} <ArrowRight className="h-4 w-4" />
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="surface-panel rounded-lg p-5 md:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Today on CoTask</p>
                <h3 className="mt-2 text-2xl font-black">Live work, not static listings.</h3>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live ready
              </span>
            </div>

            <div className="divide-y divide-border">
              {[
                {
                  icon: PlayCircle,
                  title: 'Public agent live',
                  meta: 'Visible in feed when an agent starts public mode',
                  tag: 'Reels / posts',
                },
                {
                  icon: Bell,
                  title: 'Private task live',
                  meta: 'Client joins from notification or Live Sessions',
                  tag: 'Conversation',
                },
                {
                  icon: Clock3,
                  title: 'Open task proposals',
                  meta: 'Agents apply, client chooses, then funding starts',
                  tag: 'Marketplace',
                },
              ].map((row) => (
                <div key={row.title} className="flex gap-4 py-5">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                    <row.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold">{row.title}</h4>
                      <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {row.tag}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{row.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="flow" className="bg-secondary/35 px-4 py-20 scroll-mt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Task flow</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
              From brief to proof without losing the thread.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {proofFlow.map((step, index) => (
              <div key={step.label} className="surface-panel rounded-lg p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-3xl font-black text-primary/20">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="font-bold">{step.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="use-cases" className="border-y border-border bg-background px-4 py-20 scroll-mt-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">What it is for</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
              Practical remote presence, not a generic gig board.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              The homepage now explains the actual product: remote physical tasks with live video, proof, messages, notifications, and payment handoff.
            </p>
            <Button onClick={() => goToApp('/PostJob')} className="mt-7 gap-2">
              Create a task brief <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {useCases.map((item) => (
              <div key={item.title} className="surface-panel rounded-lg p-5">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-foreground px-4 py-20 text-background sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Trust and readiness</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
              Built for real tasks that need accountability.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-background/70">
              CoTask works best when every action has a clear place: marketplace, conversation, live session, proof, payment status, and review.
            </p>
          </div>

          <div className="grid gap-3">
            {trustItems.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-lg border border-white/10 bg-white/10 p-4">
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  {index + 1}
                </div>
                <p className="text-sm font-medium leading-relaxed text-background/80">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { value: 'Client', label: 'Post tasks, book agents, review proof.', icon: Users },
              { value: 'Agent', label: 'Apply, accept, schedule, go live.', icon: UserRoundCheck },
              { value: 'Enterprise', label: 'Coordinate field work and billing.', icon: Building2 },
              { value: 'Admin', label: 'Review users, safety, payments, disputes.', icon: ShieldCheck },
            ].map((role) => (
              <div key={role.value} className="surface-panel rounded-lg p-5">
                <role.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-5 text-xl font-black">{role.value}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{role.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/35 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-primary">Quick answers</p>
          <h2 className="mt-3 text-center text-3xl font-black tracking-tight md:text-5xl">The idea in plain language.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.q} className="surface-panel rounded-lg p-5">
                <h3 className="font-bold">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Smartphone className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">Start with the job, not the menu.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Create a clean task brief, find a Local Agent, or set up your role. The homepage now sends each user to the right next step.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={() => goToApp('/PostJob')} className="gap-2">
              Post a Task <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => goToApp('/Explore')}>
              Find a Local Agent
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Link to="/" className="text-xl font-black tracking-tight">
            Co<span className="text-primary">Task</span>
          </Link>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted-foreground">
            <Link to="/HowItWorks" className="hover:text-foreground">How it works</Link>
            <Link to="/Safety" className="hover:text-foreground">Safety</Link>
            <Link to="/Pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/FAQ" className="hover:text-foreground">FAQ</Link>
            <Link to="/Contact" className="hover:text-foreground">Contact</Link>
          </div>
          <p className="text-sm text-muted-foreground">Copyright 2026 CoTask.</p>
        </div>
      </footer>
    </div>
  );
}

