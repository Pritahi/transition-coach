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

  // Deterministic daily quote based on date
  const todayIndex = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = ((hash << 5) - hash + today.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % footerQuotes.length;
  }, []);

  return { quote: footerQuotes[index], dailyQuote: footerQuotes[todayIndex] };
}

export default function MobileFooter() {
  const { todayCompletedSteps, todaySkippedSteps, lastCompletionDate, getTotalScore } = useStore();
  const { quote } = useDailyQuote();
  const score = getTotalScore();

  // Calculate streak
  const streak = useMemo(() => {
    if (!lastCompletionDate || todayCompletedSteps === 0) return 0;
    return todayCompletedSteps;
  }, [lastCompletionDate, todayCompletedSteps]);

  // Total pending today
  const totalActions = todayCompletedSteps + todaySkippedSteps;
  const completionRate = totalActions > 0 ? Math.round((todayCompletedSteps / totalActions) * 100) : 0;

  return (
    <footer className="fixed bottom-16 left-0 right-0 z-40 safe-area-inset-bottom">
      <div className="max-w-lg mx-auto">
        {/* Motivational Quote Ticker */}
        <div className="px-3 pt-1.5">
          <AnimatePresence mode="wait">
            <motion.div
              key={quote}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground font-medium text-center leading-tight truncate max-w-[260px]">
                {quote}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Stats Bar */}
        <div className="mx-2.5 mt-1.5 mb-1 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/40 border border-emerald-100 dark:border-emerald-900/30 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            {/* Steps Completed */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground leading-tight">Steps</p>
                <p className="text-xs font-bold text-foreground leading-tight tabular-nums">
                  {todayCompletedSteps}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-emerald-200/60 dark:bg-emerald-800/30 flex-shrink-0" />

            {/* Score */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground leading-tight">Score</p>
                <p className="text-xs font-bold text-foreground leading-tight tabular-nums">
                  {score}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-emerald-200/60 dark:bg-emerald-800/30 flex-shrink-0" />

            {/* Streak */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center flex-shrink-0">
                <Flame className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground leading-tight">Streak</p>
                <p className="text-xs font-bold text-foreground leading-tight tabular-nums">
                  {streak}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-emerald-200/60 dark:bg-emerald-800/30 flex-shrink-0" />

            {/* Rate */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center flex-shrink-0">
                <Heart className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground leading-tight">Rate</p>
                <p className="text-xs font-bold text-foreground leading-tight tabular-nums">
                  {completionRate}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
