'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X, CheckCircle2, Sparkles, Zap } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { playCompletionSound, completions, haptic } from '@/lib/motivation';
import { useState, useMemo } from 'react';

export default function StuckModal() {
  const { showStuckModal, stuckTask, dismissStuckModal } = useStore();
  const [done, setDone] = useState(false);

  // Memoize completion message
  const completionMsg = useMemo(() => completions[Math.floor(Math.random() * completions.length)], []);

  if (!showStuckModal || !stuckTask) return null;

  const handleDone = () => {
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
            className="fixed inset-0 z-[96] flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="bg-background border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full pointer-events-auto overflow-hidden relative">
              {/* Decorative glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-100 dark:bg-rose-900/10 rounded-full blur-3xl" />

              {!done ? (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 relative">
                    <div className="flex items-center gap-3">
                      <motion.div
                        initial={{ rotate: [0, -10, 10, -5, 0] }}
                        animate={{ rotate: [0, -10, 10, -5, 0] }}
                        transition={{ duration: 0.6, repeat: 2 }}
                        className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center"
                      >
                        <Brain className="w-6 h-6 text-rose-500" />
                      </motion.div>
                      <div>
                        <h3 className="font-bold text-base">Do this NOW</h3>
                        <p className="text-xs text-muted-foreground">
                          No options. No thinking. Just do it.
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

                  {/* THE TASK */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/10 dark:to-orange-900/10 border border-rose-200 dark:border-rose-800/30 rounded-xl p-6 text-center mb-4 relative"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2, stiffness: 300 }}
                      className="text-5xl block mb-3"
                    >
                      {stuckTask.emoji}
                    </motion.span>
                    <p className="text-xl font-extrabold text-rose-900 dark:text-rose-100 leading-tight">
                      {stuckTask.label}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Zap className="w-3 h-3 text-rose-400" />
                      <p className="text-xs text-muted-foreground">
                        ~2 min. You can do this.
                      </p>
                    </div>
                  </motion.div>

                  {/* Action */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      onClick={handleDone}
                      className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white text-base font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Done It!
                    </Button>
                  </motion.div>
                </>
              ) : (
                /* Completion state */
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="text-center py-4"
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
