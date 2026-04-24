'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, Check, Zap, Flame, Trophy, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { alarmTemplates, generateShareText, generateProgressShareText } from '@/lib/templates';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { haptic } from '@/lib/motivation';

export default function ShareSheet() {
  const { showShareSheet, setShowShareSheet, todayCompletedSteps, todaySkippedSteps, getTotalScore, alarms } = useStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const completedCount = alarms.reduce(
    (sum, a) => sum + a.steps.filter((s) => s.isCompleted).length,
    0
  );
  const totalCount = alarms.reduce((sum, a) => sum + a.steps.length, 0);
  const score = getTotalScore();

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard not available — fallback
    }
    setCopiedId(id);
    haptic('light');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNativeShare = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Transition Coach',
          text,
        });
      } catch {
        // Share cancelled
      }
    } else {
      await handleCopy(text, 'fallback');
    }
  };

  const progressText = generateProgressShareText(todayCompletedSteps, totalCount, score, todaySkippedSteps);

  return (
    <AnimatePresence>
      {showShareSheet && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
            onClick={() => setShowShareSheet(false)}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[81] bg-background rounded-t-3xl max-h-[80vh] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Share Your Flow</h3>
                <p className="text-sm text-muted-foreground">
                  Inspire others to unfreeze their day
                </p>
              </div>
              <button
                onClick={() => setShowShareSheet(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ScrollArea className="flex-1 px-5 pb-5">
              <div className="space-y-4">
                {/* PERSONAL PROGRESS CARD */}
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-bold">Your Progress Today</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-1">
                        <Zap className="w-5 h-5 text-emerald-500" />
                      </div>
                      <p className="text-lg font-bold text-gray-700">{todayCompletedSteps}</p>
                      <p className="text-[10px] text-muted-foreground">Steps done</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-1">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                      </div>
                      <p className="text-lg font-bold text-gray-700">{score}</p>
                      <p className="text-[10px] text-muted-foreground">Points</p>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-1">
                        <Flame className="w-5 h-5 text-orange-500" />
                      </div>
                      <p className="text-lg font-bold text-orange-700 dark:text-orange-400">
                        {todayCompletedSteps >= 3 ? '🔥' : todayCompletedSteps}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {todayCompletedSteps >= 3 ? 'On fire!' : 'Streak'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleNativeShare(progressText)}
                      className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1.5" />
                      Share Progress
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(progressText, 'progress')}
                      className="flex-1 rounded-lg"
                    >
                      {copiedId === 'progress' ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
                          <span className="text-gray-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1.5" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* SHARE TEMPLATES */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Or share a flow template
                  </p>
                  <div className="space-y-2">
                    {alarmTemplates.map((template) => {
                      const text = generateShareText(template);
                      const isCopied = copiedId === template.id;

                      return (
                        <div
                          key={template.id}
                          className="border border-border rounded-xl p-3 flex items-center gap-3"
                        >
                          <span className="text-2xl flex-shrink-0">{template.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm">{template.name}</h4>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {template.steps.map((s) => s.label).join(' → ')}
                            </p>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleNativeShare(text)}
                              className="h-8 w-8 p-0"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopy(text, template.id)}
                              className="h-8 w-8 p-0"
                            >
                              {isCopied ? (
                                <Check className="w-4 h-4 text-gray-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
