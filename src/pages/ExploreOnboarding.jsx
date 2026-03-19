import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, MapPin, Heart, Globe, Zap, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORIES = [
  { label: 'City Guide', emoji: '🗺️' },
  { label: 'Property Walkthrough', emoji: '🏠' },
  { label: 'Shopping Help', emoji: '🛍️' },
  { label: 'Event Attendance', emoji: '🎉' },
  { label: 'Queue & Errands', emoji: '⏳' },
  { label: 'Family Support', emoji: '👨‍👩‍👧' },
  { label: 'Business Inspection', emoji: '🏢' },
  { label: 'Training & Coaching', emoji: '💪' },
  { label: 'Travel Assistance', emoji: '✈️' },
  { label: 'Campus Help', emoji: '🎓' },
  { label: 'Medical Escort', emoji: '🏥' },
  { label: 'Legal Witnessing', emoji: '⚖️' },
  { label: 'Restaurant Scouting', emoji: '🍽️' },
  { label: 'Vehicle Inspection', emoji: '🚗' },
  { label: 'Pet Care Check', emoji: '🐾' },
  { label: 'Home Security Check', emoji: '🔒' },
  { label: 'Art & Culture Tour', emoji: '🎨' },
  { label: 'Sports & Fitness', emoji: '🏋️' },
  { label: 'Nature & Hiking', emoji: '🏞️' },
  { label: 'Nightlife Guide', emoji: '🎶' },
  { label: 'Wedding & Events', emoji: '💍' },
  { label: 'Childcare Support', emoji: '🧒' },
  { label: 'Senior Care', emoji: '👴' },
  { label: 'Luxury Concierge', emoji: '💎' },
];

const SLIDES = [
  {
    id: 'intro1',
    type: 'intro',
    badge: 'Welcome to CoTask',
    title: 'Your eyes\nanywhere on earth',
    subtitle: 'Hire a real human — your Avatar — to be physically present somewhere you can\'t be. Stream live, explore, inspect, assist. All in real time.',
    video: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
    videoLabel: 'Live streaming in action',
    stat1: { value: '2,000+', label: 'Active Avatars' },
    stat2: { value: '50+', label: 'Countries' },
    stat3: { value: '4.9★', label: 'Avg Rating' },
  },
  {
    id: 'intro2',
    type: 'intro',
    badge: 'How it works',
    title: 'Find · Book · Watch\nLive',
    subtitle: 'Browse verified avatars near any location in the world, book in seconds, and watch a private live stream from their perspective — as if you were there.',
    cards: [
      { icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'Search anywhere', desc: 'Find avatars in any city across 50+ countries' },
      { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', title: 'Book instantly', desc: 'Go live in minutes or schedule ahead' },
      { icon: Users, color: 'text-green-400', bg: 'bg-green-500/10', title: 'Trusted & verified', desc: 'Every avatar is ID-verified and rated' },
    ],
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  },
];

const QUESTION_STEPS = [
  {
    id: 'categories',
    question: "What are you looking to do?",
    hint: 'Pick all that interest you',
    type: 'multi',
  },
  {
    id: 'location',
    question: "Where do you need an avatar?",
    hint: 'Enter a city or country',
    type: 'text',
    placeholder: 'e.g. Tokyo, New York, London…',
  },
  {
    id: 'preference',
    question: "What matters most to you?",
    hint: 'Choose one',
    type: 'single',
    options: [
      { value: 'price', label: 'Best price', emoji: '💰' },
      { value: 'rating', label: 'Highest rated', emoji: '⭐' },
      { value: 'speed', label: 'Available now', emoji: '⚡' },
      { value: 'verified', label: 'Verified only', emoji: '🛡️' },
    ],
  },
];

const TOTAL_STEPS = SLIDES.length + QUESTION_STEPS.length;

export default function ExploreOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ categories: [], location: '', preference: '', customCategory: '' });
  const [direction, setDirection] = useState(1);

  const isIntroStep = step < SLIDES.length;
  const questionIndex = step - SLIDES.length;
  const currentQuestion = !isIntroStep ? QUESTION_STEPS[questionIndex] : null;
  const isLastStep = step === TOTAL_STEPS - 1;

  const goNext = () => {
    if (isLastStep) {
      finish();
      return;
    }
    setDirection(1);
    setStep(s => s + 1);
  };

  const goBack = () => {
    if (step === 0) return;
    setDirection(-1);
    setStep(s => s - 1);
  };

  const finish = () => {
    // Merge custom category into the list
    const allCategories = answers.customCategory.trim()
      ? [...answers.categories, answers.customCategory.trim()]
      : answers.categories;

    // Save preferences to localStorage so Explore can use them as suggested filters
    const prefs = {
      categories: allCategories,
      location: answers.location,
      preference: answers.preference,
      savedAt: Date.now(),
    };
    localStorage.setItem('cotask_user_prefs', JSON.stringify(prefs));

    const params = new URLSearchParams();
    if (answers.location) params.set('city', answers.location);
    if (allCategories.length) params.set('category', allCategories[0]);
    if (answers.preference) params.set('sort', answers.preference);
    navigate(`/Explore?${params.toString()}`);
  };

  const canContinue = () => {
    if (isIntroStep) return true;
    const q = QUESTION_STEPS[questionIndex];
    if (q.id === 'categories') return answers.categories.length > 0;
    if (q.id === 'location') return true; // optional
    if (q.id === 'preference') return !!answers.preference;
    return true;
  };

  const variants = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/5">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Nav */}
      <div className="fixed top-1 left-0 right-0 z-40 flex items-center justify-between px-6 py-4">
        <button onClick={goBack} className={`flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ${step === 0 ? 'invisible' : ''}`}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs text-muted-foreground">{step + 1} / {TOTAL_STEPS}</span>
        <button onClick={finish} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 pt-16 pb-24">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="w-full max-w-lg"
          >
            {/* INTRO SLIDES */}
            {step === 0 && <IntroSlide1 />}
            {step === 1 && <IntroSlide2 />}

            {/* QUESTION STEPS */}
            {!isIntroStep && currentQuestion && (
              <QuestionStep
                question={currentQuestion}
                answers={answers}
                setAnswers={setAnswers}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent">
        <Button
          onClick={goNext}
          disabled={!canContinue()}
          className="w-full max-w-lg mx-auto flex h-12 text-base bg-primary hover:bg-primary/90 disabled:opacity-40 gap-2"
        >
          {isLastStep ? 'Find My Avatar' : 'Continue'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function IntroSlide1() {
  return (
    <div className="text-center space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Welcome to CoTask
        </span>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
          Your eyes,{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-red-400">
            anywhere on earth
          </span>
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
          Hire a real human — your Avatar — to be physically present somewhere you can't be. Stream live, explore, inspect, assist. All in real time.
        </p>
      </motion.div>

      {/* Video/Image hero */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }} className="relative rounded-2xl overflow-hidden aspect-video shadow-2xl border border-white/10">
        <img
          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80"
          alt="Avatar streaming live"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </span>
          <span className="text-white text-xs glass px-2.5 py-1 rounded-full border border-white/10">Avatar streaming in Tokyo</span>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-3 gap-4">
        {[
          { value: '2,000+', label: 'Avatars' },
          { value: '50+', label: 'Countries' },
          { value: '4.9★', label: 'Avg Rating' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-3 text-center border border-white/5">
            <p className="text-lg font-bold text-primary">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function IntroSlide2() {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
          How it works
        </span>
        <h2 className="text-4xl font-bold leading-tight mb-4">
          Find · Book · Watch <span className="text-gradient">Live</span>
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Browse verified avatars near any location, book in seconds, and watch a private live stream from their perspective.
        </p>
      </motion.div>

      {/* Image */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="relative rounded-2xl overflow-hidden h-44 border border-white/10 shadow-xl">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
          alt="People using CoTask"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </motion.div>

      {/* Steps */}
      <div className="space-y-3">
        {[
          { icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', step: '01', title: 'Search anywhere', desc: 'Find avatars in any city across 50+ countries' },
          { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', step: '02', title: 'Book instantly', desc: 'Go live in minutes or schedule ahead' },
          { icon: Users, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', step: '03', title: 'Trusted & verified', desc: 'Every avatar is ID-verified and rated by clients' },
        ].map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className={`flex items-center gap-4 glass rounded-xl p-4 border ${card.border}`}
          >
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold">{card.title}</p>
              <p className="text-xs text-muted-foreground">{card.desc}</p>
            </div>
            <span className="ml-auto text-xs text-muted-foreground/40 font-mono">{card.step}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function QuestionStep({ question, answers, setAnswers }) {
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggleCategory = (cat) => {
    setAnswers(a => ({
      ...a,
      categories: a.categories.includes(cat)
        ? a.categories.filter(c => c !== cat)
        : [...a.categories, cat],
    }));
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <p className="text-xs text-primary font-medium mb-2 uppercase tracking-wider">{question.hint}</p>
        <h2 className="text-3xl font-bold leading-tight">{question.question}</h2>
      </motion.div>

      {question.type === 'multi' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="space-y-2">
          <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1 pb-1">
            {CATEGORIES.map((cat, i) => {
              const selected = answers.categories.includes(cat.label);
              return (
                <motion.button
                  key={cat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.02 }}
                  onClick={() => toggleCategory(cat.label)}
                  className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200
                    ${selected
                      ? 'bg-primary/10 border-primary/40 text-foreground'
                      : 'bg-card/40 border-white/5 text-muted-foreground hover:border-white/10 hover:bg-card/60'
                    }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="text-xs font-medium leading-snug">{cat.label}</span>
                  {selected && <CheckCircle2 className="absolute top-2 right-2 w-3.5 h-3.5 text-primary" />}
                </motion.button>
              );
            })}

            {/* Other tile */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + CATEGORIES.length * 0.02 }}
              onClick={() => setShowCustomInput(v => !v)}
              className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200
                ${showCustomInput || answers.customCategory
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-foreground'
                  : 'bg-card/40 border-white/5 text-muted-foreground hover:border-white/10 hover:bg-card/60'
                }`}
            >
              <span className="text-lg">✏️</span>
              <span className="text-xs font-medium leading-snug">Other</span>
              {answers.customCategory && <CheckCircle2 className="absolute top-2 right-2 w-3.5 h-3.5 text-yellow-400" />}
            </motion.button>
          </div>

          {/* Custom category input */}
          {showCustomInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden"
            >
              <input
                autoFocus
                type="text"
                value={answers.customCategory}
                onChange={e => setAnswers(a => ({ ...a, customCategory: e.target.value }))}
                placeholder="Describe what you need…"
                className="w-full px-4 py-3 bg-card/60 border border-yellow-500/30 rounded-xl text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-yellow-400/60 focus:ring-1 focus:ring-yellow-400/20"
              />
              <p className="text-xs text-muted-foreground mt-1.5">We'll remember this and suggest it in your feed 💡</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {question.type === 'text' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={answers.location}
              onChange={e => setAnswers(a => ({ ...a, location: e.target.value }))}
              placeholder={question.placeholder}
              className="w-full pl-11 pr-4 py-4 bg-card/60 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3">Leave blank to explore all locations</p>

          {/* Popular cities */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Popular</p>
            <div className="flex flex-wrap gap-2">
              {['London', 'New York', 'Tokyo', 'Dubai', 'Paris', 'Sydney'].map(city => (
                <button
                  key={city}
                  onClick={() => setAnswers(a => ({ ...a, location: city }))}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    answers.location === city
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'bg-card/40 border-white/5 text-muted-foreground hover:border-white/10'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {question.type === 'single' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 gap-3">
          {question.options.map((opt, i) => {
            const selected = answers.preference === opt.value;
            return (
              <motion.button
                key={opt.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                onClick={() => setAnswers(a => ({ ...a, preference: opt.value }))}
                className={`flex flex-col items-center gap-2 p-5 rounded-xl border text-center transition-all duration-200
                  ${selected
                    ? 'bg-primary/10 border-primary/40 text-foreground'
                    : 'bg-card/40 border-white/5 text-muted-foreground hover:border-white/10 hover:bg-card/60'
                  }`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-sm font-medium">{opt.label}</span>
                {selected && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}