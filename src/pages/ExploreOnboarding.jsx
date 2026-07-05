import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe,
  Home,
  MapPin,
  Search,
  Shield,
  ShoppingBag,
  Users,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORIES = [
  { label: 'City Guide', icon: MapPin },
  { label: 'Property Walkthrough', icon: Home },
  { label: 'Shopping Help', icon: ShoppingBag },
  { label: 'Event Attendance', icon: Users },
  { label: 'Queue & Errands', icon: Users },
  { label: 'Family Support', icon: Users },
  { label: 'Business Inspection', icon: Building2 },
  { label: 'Travel Assistance', icon: Globe },
  { label: 'Campus Help', icon: Building2 },
  { label: 'Vehicle Inspection', icon: Search },
  { label: 'Home Security Check', icon: Home },
  { label: 'Restaurant Scouting', icon: MapPin },
];

const INTRO_CARDS = [
  {
    icon: Search,
    title: 'Search by place or task',
    desc: 'Tell CoTask where you need someone and what needs to be checked.',
  },
  {
    icon: Video,
    title: 'Use live video or proof',
    desc: 'Direct the Local Agent in real time when live video is available, or review uploaded proof after the task.',
  },
  {
    icon: Shield,
    title: 'Keep payment clear',
    desc: 'Use Secure Payment when required, then approve completion after the work is reviewed.',
  },
];

const QUESTION_STEPS = [
  {
    id: 'categories',
    question: 'What do you need help with?',
    hint: 'Pick one or more task types',
    type: 'multi',
  },
  {
    id: 'location',
    question: 'Where do you need a Local Agent?',
    hint: 'City, neighbourhood, or country',
    type: 'text',
    placeholder: 'e.g. Tokyo, New York, London',
  },
  {
    id: 'preference',
    question: 'What matters most?',
    hint: 'Choose one search preference',
    type: 'single',
    options: [
      { value: 'price', label: 'Best price' },
      { value: 'rating', label: 'Strong reviews' },
      { value: 'speed', label: 'Available soon' },
      { value: 'verified', label: 'Verification status' },
    ],
  },
];

const TOTAL_STEPS = 2 + QUESTION_STEPS.length;

export default function ExploreOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ categories: [], location: '', preference: '', customCategory: '' });
  const [direction, setDirection] = useState(1);

  const isIntroStep = step < 2;
  const questionIndex = step - 2;
  const currentQuestion = !isIntroStep ? QUESTION_STEPS[questionIndex] : null;
  const isLastStep = step === TOTAL_STEPS - 1;

  const finish = () => {
    const allCategories = answers.customCategory.trim()
      ? [...answers.categories, answers.customCategory.trim()]
      : answers.categories;
    localStorage.setItem('cotask_user_prefs', JSON.stringify({
      categories: allCategories,
      location: answers.location,
      preference: answers.preference,
      savedAt: Date.now(),
    }));

    const params = new URLSearchParams();
    if (answers.location) params.set('city', answers.location);
    if (allCategories.length) params.set('category', allCategories[0]);
    if (answers.preference) params.set('sort', answers.preference);
    navigate(`/Explore?${params.toString()}`);
  };

  const goNext = () => {
    if (isLastStep) {
      finish();
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step === 0) return;
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const canContinue = () => {
    if (isIntroStep) return true;
    const q = QUESTION_STEPS[questionIndex];
    if (q.id === 'categories') return answers.categories.length > 0 || Boolean(answers.customCategory.trim());
    if (q.id === 'preference') return Boolean(answers.preference);
    return true;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-secondary/60">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>

      <div className="fixed inset-x-0 top-1 z-40 flex items-center justify-between px-6 py-4">
        <button onClick={goBack} className={`flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground ${step === 0 ? 'invisible' : ''}`}>
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <span className="text-xs text-muted-foreground">{step + 1} / {TOTAL_STEPS}</span>
        <button onClick={finish} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          Skip
        </button>
      </div>

      <main className="flex flex-1 items-center justify-center px-4 pb-24 pt-16">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={{
              enter: (d) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
              center: { opacity: 1, x: 0 },
              exit: (d) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-2xl"
          >
            {step === 0 && <IntroOne />}
            {step === 1 && <IntroTwo />}
            {!isIntroStep && currentQuestion && (
              <QuestionStep question={currentQuestion} answers={answers} setAnswers={setAnswers} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/95 to-transparent px-6 pb-8 pt-4">
        <Button
          onClick={goNext}
          disabled={!canContinue()}
          className="mx-auto flex h-12 w-full max-w-lg gap-2 text-base disabled:opacity-40"
        >
          {isLastStep ? 'Find Local Agents' : 'Continue'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function IntroOne() {
  return (
    <div className="space-y-8 text-center">
      <div>
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
          Be there without being there
        </span>
        <h1 className="mx-auto max-w-xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
          Find a Local Agent for real-world help, wherever you need it.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
          CoTask helps you discover people who can inspect, visit, record, or livestream from a location on your behalf.
        </p>
      </div>

      <div className="surface-panel mx-auto max-w-lg rounded-lg p-4 text-left shadow-sm">
        <div className="rounded-lg bg-secondary/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Open Task</p>
              <p className="mt-1 font-semibold">Check apartment condition before signing</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Paris</span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {['Location proof', 'Live video', 'Secure Payment'].map((item) => (
              <span key={item} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IntroTwo() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <span className="mb-5 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700">
          How it works
        </span>
        <h2 className="text-4xl font-black leading-tight tracking-tight">Search, choose, coordinate, approve.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          A clear task and strong Local Agent profile make the work easier to review.
        </p>
      </div>

      <div className="grid gap-3">
        {INTRO_CARDS.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i }}
            className="surface-panel flex items-center gap-4 rounded-lg p-4"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <card.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{card.title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{card.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function QuestionStep({ question, answers, setAnswers }) {
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggleCategory = (cat) => {
    setAnswers((a) => ({
      ...a,
      categories: a.categories.includes(cat)
        ? a.categories.filter((c) => c !== cat)
        : [...a.categories, cat],
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">{question.hint}</p>
        <h2 className="text-3xl font-black leading-tight">{question.question}</h2>
      </div>

      {question.type === 'multi' && (
        <div className="space-y-3">
          <div className="grid max-h-[360px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const selected = answers.categories.includes(cat.label);
              const Icon = cat.icon;
              return (
                <button
                  key={cat.label}
                  onClick={() => toggleCategory(cat.label)}
                  className={`relative rounded-lg border p-3 text-left transition-all ${
                    selected
                      ? 'border-primary/40 bg-primary/10 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-secondary/40'
                  }`}
                >
                  <Icon className="mb-3 h-4 w-4" />
                  <span className="text-xs font-medium leading-snug">{cat.label}</span>
                  {selected && <CheckCircle2 className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
            <button
              onClick={() => setShowCustomInput((v) => !v)}
              className={`relative rounded-lg border p-3 text-left transition-all ${
                showCustomInput || answers.customCategory
                  ? 'border-amber-300 bg-amber-50 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-secondary/40'
              }`}
            >
              <Search className="mb-3 h-4 w-4" />
              <span className="text-xs font-medium leading-snug">Other task</span>
            </button>
          </div>

          {showCustomInput && (
            <input
              autoFocus
              type="text"
              value={answers.customCategory}
              onChange={(e) => setAnswers((a) => ({ ...a, customCategory: e.target.value }))}
              placeholder="Describe what you need"
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
            />
          )}
        </div>
      )}

      {question.type === 'text' && (
        <div>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={answers.location}
              onChange={(e) => setAnswers((a) => ({ ...a, location: e.target.value }))}
              placeholder={question.placeholder}
              className="w-full rounded-lg border border-border bg-card py-4 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Leave blank to explore all locations.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['London', 'New York', 'Tokyo', 'Dubai', 'Paris', 'Sydney'].map((city) => (
              <button
                key={city}
                onClick={() => setAnswers((a) => ({ ...a, location: city }))}
                className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                  answers.location === city
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      )}

      {question.type === 'single' && (
        <div className="grid grid-cols-2 gap-3">
          {question.options.map((opt) => {
            const selected = answers.preference === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setAnswers((a) => ({ ...a, preference: opt.value }))}
                className={`rounded-lg border p-5 text-center transition-all ${
                  selected
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-secondary/40'
                }`}
              >
                <span className="text-sm font-semibold">{opt.label}</span>
                {selected && <CheckCircle2 className="mx-auto mt-2 h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

