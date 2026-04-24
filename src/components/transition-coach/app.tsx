'use client';

import { useSyncExternalStore } from 'react';
import { AnimatePresence } from 'framer-motion';
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
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Transition Coach</h1>
          <div className="flex items-center gap-3">
            {score > 0 && (
              <span className="text-sm font-medium text-muted-foreground tabular-nums">
                {score} pts
              </span>
            )}
            {todayCompletedSteps > 0 && (
              <span className="text-sm font-medium tabular-nums">
                {todayCompletedSteps} done
              </span>
            )}
          </div>
        </div>

        {/* Energy Mode */}
        {currentView === 'now' && (
          <div className="max-w-lg mx-auto px-4 pb-3">
            <EnergyModeSelector />
          </div>
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
