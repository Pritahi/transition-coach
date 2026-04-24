'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, TrendingUp, Sparkles, Heart } from 'lucide-react';
import { useStore } from '@/store/useStore';

const footerQuotes = [
  'Small steps. Big moves.',
  "You're building momentum.",
  'ADHD is a superpower — use it.',
  'Done is better than perfect.',
  "One step at a time. That's all.",
  'Your brain is wired for action.',
  'No shame. Just restart.',
  "Today's win: you showed up.",
  'Progress > Perfection.',
  "You're not lazy. You're different.",
  'This app gets you. Period.',
  'Start messy. Finish proud.',
  'Discipline > Motivation.',
  "Every completed step rewires your brain.",
  'Built for brains that think different.',
];

function useDailyQuote() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % footerQuotes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return { quote: footerQuotes[index] };
}

export default function MobileFooter() {
  const { todayCompletedSteps, todaySkippedSteps, lastCompletionDate, getTotalScore } = useStore();
  const { quote } = useDailyQuote();
  const score = getTotalScore();

  const streak = useMemo(() => {
    if (!lastCompletionDate || todayCompletedSteps === 0) return 0;
    return todayCompletedSteps;
  }, [lastCompletionDate, todayCompletedSteps]);

  const totalActions = todayCompletedSteps + todaySkippedSteps;
  const completionRate = totalActions > 0 ? Math.round((todayCompletedSteps / totalActions) * 100) : 0;

  return (
    <footer className="fixed bottom-[50px] left-0 right-0 z-40 safe-area-inset-bottom">
      <div className="max-w-lg mx-auto px-3">
        {/* Motivational Quote */}
        <div className="flex justify-center py-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={quote}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-1"
            >
              <p className="text-[10px] text-muted-foreground/60 font-medium text-center leading-tight">
                {quote}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Stats Bar — iOS compact style */}
        <div className="mb-0.5 rounded-xl bg-gray-50 backdrop-blur-sm border border-gray-100 px-2.5 py-1.5">
          <div className="flex items-center justify-between gap-0.5">
            <div className="flex items-center gap-0.5 min-w-0">
              <Zap className="w-3 h-3 text-gray-700 flex-shrink-0" />
              <span className="text-[12px] font-bold text-foreground tabular-nums">{todayCompletedSteps}</span>
            </div>

            <div className="w-px h-3 bg-border/40" />

            <div className="flex items-center gap-0.5 min-w-0">
              <TrendingUp className="w-3 h-3 text-gray-700 flex-shrink-0" />
              <span className="text-[12px] font-bold text-foreground tabular-nums">{score}</span>
            </div>

            <div className="w-px h-3 bg-border/40" />

            <div className="flex items-center gap-0.5 min-w-0">
              <Flame className="w-3 h-3 text-orange-500 flex-shrink-0" />
              <span className="text-[12px] font-bold text-foreground tabular-nums">{streak}</span>
            </div>

            <div className="w-px h-3 bg-border/40" />

            <div className="flex items-center gap-0.5 min-w-0">
              <Heart className="w-3 h-3 text-rose-400 flex-shrink-0" />
              <span className="text-[12px] font-bold text-foreground tabular-nums">{completionRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
