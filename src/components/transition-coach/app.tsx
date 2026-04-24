'use client';

import { useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';

// Hydration gate: true on client, false on server
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;
function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
import NowScreen from '@/components/transition-coach/now-screen';
import AlarmsList from '@/components/transition-coach/alarms-list';
import WaitingMode from '@/components/transition-coach/waiting-mode';
import CreateAlarmSheet from '@/components/transition-coach/create-alarm-sheet';
import BottomNav from '@/components/transition-coach/bottom-nav';
import EnergyModeSelector from '@/components/transition-coach/energy-mode-selector';
import CelebrationOverlay from '@/components/transition-coach/celebration-overlay';
import StuckModal from '@/components/transition-coach/stuck-modal';
import ShareSheet from '@/components/transition-coach/share-sheet';
import MobileFooter from '@/components/transition-coach/mobile-footer';
import OnboardingScreen from '@/components/transition-coach/onboarding-screen';

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export default function TransitionCoach() {
  const hydrated = useHydrated();
  const { currentView, todayCompletedSteps, getTotalScore, hasOnboarded } = useStore();
  const score = getTotalScore();

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center animate-pulse">
            <ZapIcon className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Onboarding — full screen overlay on first visit */}
      <AnimatePresence>
        {!hasOnboarded && <OnboardingScreen />}
      </AnimatePresence>

      {/* Header — simplified */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-500/20">
              <ZapIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="text-sm font-bold tracking-tight">Transition Coach</h1>
          </div>
          <div className="flex items-center gap-2">
            {score > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/30"
              >
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {score}
                </span>
              </motion.div>
            )}
            {todayCompletedSteps >= 3 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800/30"
              >
                <span className="text-xs">🔥</span>
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                  {todayCompletedSteps}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Energy Mode — only on NOW screen, compact */}
        {currentView === 'now' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-lg mx-auto px-4 pb-2"
          >
            <EnergyModeSelector />
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full pb-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {currentView === 'now' && <NowScreen />}
            {currentView === 'alarms' && <AlarmsList />}
            {currentView === 'waiting' && <WaitingMode />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Footer */}
      <MobileFooter />

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Overlays */}
      <CreateAlarmSheet />
      <CelebrationOverlay />
      <StuckModal />
      <ShareSheet />
    </div>
  );
}
