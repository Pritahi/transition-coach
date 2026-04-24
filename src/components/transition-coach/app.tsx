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
      {/* Header - iOS Style */}
      <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-2xl">
        <div className="max-w-lg mx-auto px-5 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
              <ZapIcon className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground">Transition Coach</h1>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {score > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full"
              >
                <span className="text-xs font-semibold text-primary tabular-nums">
                  {score}
                </span>
              </motion.div>
            )}
            {todayCompletedSteps >= 3 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 bg-orange-500/10 px-2.5 py-1.5 rounded-full"
              >
                <span className="text-xs font-semibold text-orange-500 tabular-nums">
                  {todayCompletedSteps}
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Energy Mode - iOS Segmented Control Style */}
        {currentView === 'now' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-lg mx-auto px-5 pb-3"
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
