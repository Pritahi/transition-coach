'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useStore, createAlarmData } from '@/store/useStore';
import { playStartSound, haptic } from '@/lib/motivation';

const onboardingSteps = [
  {
    emoji: '🧠',
    title: "Can't decide what to do next?",
    subtitle: "That's not laziness. That's ADHD.",
    description: "Your brain struggles with transitions — not motivation. This app removes the 'what now?' moment.",
  },
  {
    emoji: '⚡',
    title: "One alarm. Clear steps. Just start.",
    subtitle: "Let's fix your next 30 minutes.",
    description: "We'll create your first smart alarm right now. No setup. No thinking.",
  },
];

export default function OnboardingScreen() {
  const { hasOnboarded, setHasOnboarded, addAlarm, setCurrentView } = useStore();
  const [step, setStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [done, setDone] = useState(false);

  if (hasOnboarded) return null;

  const handleNext = () => {
    if (step < onboardingSteps.length - 1) {
      setStep(step + 1);
      haptic('light');
    }
  };

  const handleQuickStart = () => {
    setIsCreating(true);
    haptic('medium');

    // Create a "Leave Home" alarm 30 min from now with 3 auto steps
    const thirtyMinLater = new Date();
    thirtyMinLater.setMinutes(thirtyMinLater.getMinutes() + 30);

    const alarm = createAlarmData(
      "Next 30 Minutes",
      thirtyMinLater.toISOString(),
      [
        { label: "Get up and stretch for 2 min", minutesBefore: 20 },
        { label: "Drink a glass of water", minutesBefore: 10 },
        { label: "Do the one thing you've been avoiding", minutesBefore: 0 },
      ],
    );

    addAlarm(alarm);
    playStartSound();

    setTimeout(() => {
      setDone(true);
      haptic('heavy');
    }, 800);

    setTimeout(() => {
      setHasOnboarded(true);
      setCurrentView('now');
    }, 3000);
  };

  const current = onboardingSteps[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-background flex items-center justify-center"
    >
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-amber-100 dark:bg-amber-900/20 rounded-full blur-3xl opacity-60" />
      </div>

      <div className="relative z-10 max-w-sm mx-auto px-6 w-full">
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="text-center"
            >
              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {onboardingSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i <= step ? 'bg-emerald-500 w-8' : 'bg-muted-foreground/20 w-4'
                    }`}
                  />
                ))}
              </div>

              {/* Emoji */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-900/30 dark:to-amber-900/30 border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-center shadow-lg shadow-emerald-500/10"
              >
                <span className="text-5xl">{current.emoji}</span>
              </motion.div>

              {/* Title */}
              <h1 className="text-2xl font-extrabold mb-1 leading-tight">
                {current.title}
              </h1>

              {/* Subtitle */}
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
                {current.subtitle}
              </p>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-[280px] mx-auto">
                {current.description}
              </p>

              {/* Action Button */}
              {step < onboardingSteps.length - 1 ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base shadow-lg shadow-emerald-500/20 transition-colors"
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleQuickStart}
                  disabled={isCreating}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-70"
                >
                  {isCreating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Zap className="w-5 h-5" />
                      </motion.div>
                      Creating your first flow...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-current" />
                      Fix My Next 30 Min
                    </>
                  )}
                </motion.button>
              )}

              {/* Skip option */}
              {!isCreating && step < onboardingSteps.length - 1 && (
                <button
                  onClick={() => {
                    setHasOnboarded(true);
                    haptic('light');
                  }}
                  className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip onboarding
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </motion.div>
              <h2 className="text-2xl font-extrabold mb-2">
                You&apos;re all set! 🎉
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                Your first alarm is ready — 3 steps, 30 minutes.
              </p>
              <div className="flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Head to the NOW tab to start
                </p>
              </div>
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mt-6"
              >
                <p className="text-xs text-muted-foreground">Loading...</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
