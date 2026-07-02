import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  ChevronRight,
  ClipboardList,
  Menu,
  Search,
  Smartphone,
  X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';



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
    title: 'Post an Open Task',
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
              <Button onClick={() => goToApp('/PostJob')}>Post a Task</Button>
            </div>
          </div>
        )}
      </nav>

      <section className="relative flex min-h-[75svh] items-center px-4 pb-10 pt-24 sm:px-6 md:min-h-[80svh] lg:px-8 overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0 bg-black">
          <video
            className="h-full w-full object-cover opacity-60"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="https://videos.pexels.com/video-files/6715779/6715779-hd_1920_1080_25fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
              <Smartphone className="h-3.5 w-3.5 text-cyan-200" />
              Live local help
            </span>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Remote tasks,<br />handled locally.
            </h1>
            <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground md:text-lg">
              Book a Local Agent to visit, inspect, livestream, or collect proof when you cannot be there yourself.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => goToApp('/PostJob')} className="h-12 justify-center gap-2 px-7 text-base">
                Post a Task <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => goToApp('/Explore')}
                className="h-12 justify-center px-7 text-base"
              >
                Find an Agent
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="start" className="border-t border-border bg-background px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-3">
            {entryRoutes.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => goToApp(item.path)}
                className="surface-panel glass-hover flex flex-col rounded-xl p-5 text-left"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground flex-1">{item.text}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                  {item.action} <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/30 px-4 py-10 sm:px-6 lg:px-8 border-t border-border">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">See the flow</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground md:text-3xl">A task should feel this clear.</h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              CoTask moves people quickly from a need to a clear task, then into messages, live video, proof, and payment.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {videoStories.map((story) => (
              <div key={story.label} className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm aspect-video sm:aspect-auto sm:h-56">
                <video
                  className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/80">{story.label}</p>
                  <h3 className="mt-1 text-base font-bold leading-tight">{story.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-foreground px-4 py-10 text-background sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-lg">
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">Start with one task.</h2>
            <p className="mt-2 text-sm leading-relaxed text-background/70">
              Write the brief, choose the Local Agent, and keep the whole job in one conversation.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row w-full md:w-auto">
            <Button size="lg" onClick={() => goToApp('/PostJob')} className="gap-2 h-11 w-full sm:w-auto text-primary bg-primary-foreground hover:bg-primary-foreground/90">
              Post a Task <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => goToApp('/Explore')} className="h-11 w-full sm:w-auto border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
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