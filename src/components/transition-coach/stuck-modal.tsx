'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X, CheckCircle2, Sparkles, Zap, Feather } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { playCompletionSound, completions, haptic } from '@/lib/motivation';
import { useState, useMemo } from 'react';

const difficultyConfig = {
  easy: {
    label: 'Easy',
    emoji: '🟢',
    description: '~2 min',
    color: 'border-gray-200 bg-gray-50 hover:border-gray-400',
    selectedColor: 'border-gray-800 bg-gray-50 ring-2 ring-gray-800/30',
    textColor: 'text-gray-700',
  },
  medium: {
    label: 'Medium',
    emoji: '🟡',
    description: '~5 min',
    color: 'border-gray-200 bg-gray-50 hover:border-gray-400',
    selectedColor: 'border-gray-800 bg-gray-50 ring-2 ring-gray-800/30',
    textColor: 'text-gray-700',
  },
  tiny: {
    label: 'Tiny',
    emoji: '🔵',
    description: '~30 sec',
    color: 'border-sky-200 dark:border-sky-800/30 bg-sky-50 dark:bg-sky-900/10 hover:border-sky-400',
    selectedColor: 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 ring-2 ring-sky-500/30',
    textColor: 'text-sky-700 dark:text-sky-300',
  },
} as const;

export default function StuckModal() {
  const { showStuckModal, stuckTasks, dismissStuckModal } = useStore();
  const [done, setDone] = useState(false);
  const [completedTask, setCompletedTask] = useState<{ label: string; emoji: string } | null>(null);

  const completionMsg = useMemo(() => completions[Math.floor(Math.random() * completions.length)], []);

  if (!showStuckModal || stuckTasks.length === 0) return null;

  const handleDone = (task: typeof stuckTasks[number]) => {
    setCompletedTask(task);
    setDone(true);
    playCompletionSound();
    haptic('heavy');
    setTimeout(() => {
      dismissStuckModal();
    }, 2200);
  };

  const handleDismiss = () => {
    dismissStuckModal();
    haptic('light');
  };

  const difficultyIcons = {
    easy: Feather,
    medium: Zap,
    tiny: Sparkles,
  };

  return (
    <AnimatePresence>
      {showStuckModal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed inset-0 z-[96] flex items-center justify-center p-5 pointer-events-none"
          >
            <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-sm w-full pointer-events-auto overflow-hidden relative">
              {/* Decorative glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-100 dark:bg-emerald-900/10 rounded-full blur-3xl" />

              {!done ? (
                <>
                  {/* Header */}
                  <div className="px-5 pt-5 pb-3 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          initial={{ rotate: [0, -10, 10, -5, 0] }}
                          animate={{ rotate: [0, -10, 10, -5, 0] }}
                          transition={{ duration: 0.6, repeat: 2 }}
                          className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center"
                        >
                          <Brain className="w-5 h-5 text-rose-500" />
                        </motion.div>
                        <div>
                          <h3 className="font-bold text-base">I&apos;m stuck</h3>
                          <p className="text-xs text-muted-foreground">
                            Pick your level — one thing to do right now
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleDismiss}
                        className="text-muted-foreground hover:text-foreground p-1 -mr-1 -mt-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 3 Task Options */}
                  <div className="px-5 pb-5 space-y-2.5 relative">
                    {stuckTasks.map((task, i) => {
                      const config = difficultyConfig[task.difficulty];
                      const Icon = difficultyIcons[task.difficulty];

                      return (
                        <motion.button
                          key={task.difficulty}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.08 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleDone(task)}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${config.color}`}
                        >
                          {/* Emoji */}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.15 + i * 0.08 }}
                            className="w-10 h-10 rounded-xl bg-white dark:bg-background/60 flex items-center justify-center flex-shrink-0 shadow-sm"
                          >
                            <span className="text-xl">{task.emoji}</span>
                          </motion.div>

                          {/* Task info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground leading-tight">
                              {task.label}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Icon className={`w-3 h-3 ${config.textColor}`} />
                              <span className={`text-[11px] font-medium ${config.textColor}`}>
                                {config.label} · {config.description}
                              </span>
                            </div>
                          </div>

                          {/* Do it button */}
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm`}>
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* Completion state */
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="text-center py-6 px-5"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
                  >
                    <Sparkles className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
                  </motion.div>
                  <p className="text-lg font-bold mb-1">{completionMsg}</p>
                  <p className="text-sm text-muted-foreground">
                    {completedTask?.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You&apos;re unstuck now. Keep going.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
