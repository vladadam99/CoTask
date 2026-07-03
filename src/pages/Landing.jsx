import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarCheck,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Home,
  MapPin,
  Menu,
  MessageSquare,
  Search,
  ShieldCheck,
  Smartphone,
  UserRoundCheck,
  Video,
  X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=2400&q=82';

const entryRoutes = [
  {
    icon: Search,
    title: 'Find a Local Agent',
    text: 'Choose someone nearby for a live visit, inspection, errand, or local proof.',
    action: 'Explore agents',
    path: '/Explore',
  },
  {
    icon: ClipboardList,
    title: 'Create a Brief',
    text: 'Describe the job once and let qualified Local Agents send useful proposals.',
    action: 'Create task',
    path: '/PostJob',
  },
  {
    icon: Building2,
    title: 'Set Up Enterprise',
    text: 'Coordinate repeat site checks, team tasks, and billing from one workspace.',
    action: 'Start setup',
    path: '/Onboarding?role=enterprise',
  },
];

const steps = [
  { icon: ClipboardList, title: 'Brief', text: 'Set the place, timing, budget, and outcome.' },
  { icon: MessageSquare, title: 'Agree', text: 'Chat, choose the agent, and confirm the task.' },
  { icon: Video, title: 'Review', text: 'Join live or approve uploaded proof after the work.' },
];

const useCases = [
  { icon: Home, title: 'Property viewings' },
  { icon: Camera, title: 'Item condition checks' },
  { icon: MapPin, title: 'Local verification' },
  { icon: Briefcase, title: 'Business site tasks' },
];

const trustSignals = [
  { icon: UserRoundCheck, text: 'Agent profiles and reviews' },
  { icon: ShieldCheck, text: 'Task records and proof' },
  { icon: CalendarCheck, text: 'Scheduling and notifications' },
  { icon: CheckCircle2, text: 'Secure Payment handoff' },
];

const videoStories = [
  {
    label: 'Client request',
    title: 'Someone needs help somewhere else.',
    text: 'A client posts what they need checked, shown, picked up, or verified.',
    src: 'https://videos.pexels.com/video-files/6414089/6414089-uhd_2160_3840_24fps.mp4',
  },
  {
    label: 'Agent on location',
    title: 'A Local Agent goes there.',
    text: 'The agent follows the brief, talks through the details, and shares proof.',
    src: 'https://videos.pexels.com/video-files/6715779/6715779-hd_1920_1080_25fps.mp4',
  },
  {
    label: 'Proof and payment',
    title: 'The client reviews and pays safely.',
    text: 'Proof, messages, status, and Secure Payment stay connected to the task.',
    src: 'https://videos.pexels.com/video-files/7535102/7535102-hd_1920_1080_25fps.mp4',
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
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
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
            <button onClick={() => scrollTo('how')} className="text-sm font-semibold opacity-80 transition hover:opacity-100">
              How it works
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
              New Brief
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
              <button
                onClick={() => {
                  scrollTo('start');
                  setMenuOpen(false);
                }}
                className="rounded-lg px-3 py-3 text-left hover:bg-secondary"
              >
                Start
              </button>
              <button
                onClick={() => {
                  scrollTo('how');
                  setMenuOpen(false);
                }}
                className="rounded-lg px-3 py-3 text-left hover:bg-secondary"
              >
                How it works
              </button>
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
              <Button onClick={() => goToApp('/PostJob')}>New Brief</Button>
            </div>
          </div>
        )}
      </nav>

      <section
        className="relative flex min-h-[72svh] items-center bg-cover bg-center px-4 pb-10 pt-24 sm:px-6 md:min-h-[82svh] lg:px-8"
        style={{
          backgroundImage: `linear-gradient(90deg, hsl(222 47% 7% / 0.93) 0%, hsl(222 47% 7% / 0.78) 48%, hsl(222 47% 7% / 0.35) 100%), url(${HERO_IMAGE})`,
        }}
      >
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
              <Smartphone className="h-3.5 w-3.5 text-cyan-200" />
              Live local help
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Remote tasks, handled locally.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-white/80 md:text-xl">
              Book a Local Agent to visit, inspect, livestream, or collect proof when you cannot be there yourself.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => goToApp('/PostJob')} className="h-12 justify-center gap-2 px-7 text-base md:h-14">
                New Brief <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => goToApp('/Explore')}
                className="h-12 justify-center border-white/30 bg-white/10 px-7 text-base text-white hover:bg-white hover:text-foreground md:h-14"
              >
                Find an Agent
              </Button>
            </div>
            <button onClick={() => goToApp('/Onboarding?role=avatar')} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white/75 transition hover:text-white">
              Become a Local Agent <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section id="start" className="border-b border-border bg-background px-4 py-16 scroll-mt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Start here</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">What do you need?</h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {entryRoutes.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => goToApp(item.path)}
                className="surface-panel glass-hover rounded-lg p-5 text-left"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-2 min-h-[64px] text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                  {item.action} <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-secondary/35 px-4 py-16 scroll-mt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">How it works</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Simple flow. Fewer decisions.</h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                CoTask should move people quickly from a need to a clear task, then into messages, live video, proof, and payment status.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="surface-panel rounded-lg p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="text-2xl font-black text-primary/20">{index + 1}</span>
                  </div>
                  <h3 className="font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">See the flow</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">A task should feel this clear.</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {videoStories.map((story) => (
              <div key={story.label} className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <div className="relative aspect-[4/5] overflow-hidden bg-foreground sm:aspect-video">
                  <video
                    className="h-full w-full object-cover opacity-85 transition duration-300 group-hover:scale-[1.02] group-hover:opacity-100"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label={story.title}
                    onCanPlay={(event) => event.currentTarget.play().catch(() => {})}
                  >
                    <source src={story.src} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">{story.label}</p>
                    <h3 className="mt-2 text-xl font-black">{story.title}</h3>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-white/75">{story.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/35 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Popular tasks</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Useful when presence matters.</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {useCases.map((item) => (
                <div key={item.title} className="surface-panel flex items-center gap-3 rounded-lg p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-foreground px-4 py-16 text-background sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Built-in structure</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Live, proof, messages, and payment in one place.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustSignals.map((item) => (
              <div key={item.text} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/10 p-4">
                <item.icon className="h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-sm font-semibold text-background/80">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black tracking-tight md:text-5xl">Start with one task.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Write the brief, choose the Local Agent, and keep the whole job in one conversation.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={() => goToApp('/PostJob')} className="gap-2">
              New Brief <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => goToApp('/Explore')}>
              Browse Agents
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

