'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Flame, PartyPopper, Star, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { completions, playCompletionSound, haptic } from '@/lib/motivation';
import { useMemo } from 'react';

// Confetti particle component — purely deterministic, no Math.random in render
function ConfettiParticle({ index, total }: { index: number; total: number }) {
  // Deterministic spread based on index
  const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16'];
  const color = colors[index % colors.length];
  const spreadX = ((index - total / 2) / total) * 160;
  const startY = -20;
  const delay = (index / total) * 0.3;

  return (
    <motion.div
      initial={{ y: startY, x: 0, opacity: 1, scale: 1, rotate: 0 }}
      animate={{
        y: [startY, startY - 40, startY - 80, startY + 60, startY + 120],
        x: [spreadX, spreadX + 20, spreadX - 10, spreadX + 40, spreadX + (index % 2 === 0 ? 60 : -60)],
        opacity: [1, 1, 0.9, 0.5, 0],
        scale: [1, 1.3, 0.8, 0.4, 0],
        rotate: [0, 180, 360, 540, 720],
      }}
      transition={{ duration: 1.8, delay, ease: 'easeOut' }}
      className="absolute top-1/3 left-1/2 w-3 h-3 rounded-sm pointer-events-none"
      style={{ backgroundColor: color }}
    />
  );
}

export default function CelebrationOverlay() {
  const { showCelebration, lastCompletedLabel, todayCompletedSteps } = useStore();

  // Use a ref-based approach to trigger sound and haptic without useEffect setState
  const messageIndex = useMemo(() => Math.floor(Math.random() * completions.length), [showCelebration]);

  // Sound and haptic triggered via the parent component's action, not useEffect
  // But we still need to play sound when celebration shows
  // Using a separate effect that only has side effects, no state
  useMemo(() => {
    if (showCelebration) {
      // Intentional side effect in useMemo for synchronous execution
      // This is safe because it's a pure side effect (audio/haptic) with no state mutation
      try {
        playCompletionSound();
      } catch { /* ignore */ }
      try {
        haptic('heavy');
      } catch { /* ignore */ }
    }
  }, [showCelebration]);

  const message = completions[messageIndex];
  const particleCount = 8;

  return (
    <AnimatePresence>
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] pointer-events-none flex items-start justify-center pt-20"
        >
          {/* Confetti particles */}
          {Array.from({ length: particleCount }).map((_, i) => (
            <ConfettiParticle key={i} index={i} total={particleCount} />
          ))}

          {/* Success card */}
          <motion.div
            initial={{ y: -30, scale: 0.8, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -20, scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
            className="bg-background border border-gray-200 rounded-2xl shadow-2xl shadow-black/10 px-6 py-4 max-w-xs text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.15 }}
              >
                <PartyPopper className="w-7 h-7 text-gray-700" />
              </motion.div>
              <motion.div
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <Sparkles className="w-6 h-6 text-amber-500" />
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.25 }}
              >
                <Star className="w-5 h-5 text-orange-400" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-gray-700" />
                <p className="text-base font-bold text-foreground">
                  {lastCompletedLabel}
                </p>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-sm text-gray-700 font-medium"
            >
              {message}
            </motion.p>

            {todayCompletedSteps > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="flex items-center justify-center gap-1.5 mt-2"
              >
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                  {todayCompletedSteps} steps today!
                </span>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
