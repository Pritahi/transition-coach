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
  const { currentView, todayCompletedSteps, getTotalScore } = useStore();
  const score = getTotalScore();

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* iOS-style frosted header */}
      <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-2xl border-b border-border/40">
        <div className="max-w-lg mx-auto px-5 h-[52px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-[30px] h-[30px] rounded-[9px] bg-black dark:bg-white flex items-center justify-center">
              <ZapIcon className="w-4 h-4 text-white dark:text-black" />
            </div>
            <h1 className="text-[17px] font-bold tracking-tight">
              Transition Coach
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {score > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full"
              >
                <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {score}
                </span>
                <span className="text-[10px] text-emerald-500 font-medium">pts</span>
              </motion.div>
            )}
            {todayCompletedSteps >= 3 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-1 rounded-full"
              >
                <span className="text-[12px] font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                  {todayCompletedSteps}
                </span>
                <span className="text-xs leading-none">🔥</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Energy Mode — only on NOW screen */}
        <AnimatePresence>
          {currentView === 'now' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-lg mx-auto px-5 pb-2.5"
            >
              <EnergyModeSelector />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full pb-[132px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
