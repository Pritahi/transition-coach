'use client';

import { motion } from 'framer-motion';
import { Zap, Clock, Timer, Brain } from 'lucide-react';
import { useStore } from '@/store/useStore';

const tabs = [
  { id: 'now' as const, label: 'NOW', icon: Zap, activeColor: 'text-emerald-500' },
  { id: 'alarms' as const, label: 'Alarms', icon: Clock, activeColor: 'text-foreground' },
  { id: 'waiting' as const, label: 'Wait', icon: Timer, activeColor: 'text-amber-500' },
];

export default function BottomNav() {
  const { currentView, setCurrentView, showStuckModal } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border safe-area-inset-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-4">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className="relative flex flex-col items-center justify-center w-full h-full gap-0.5 py-1"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-emerald-500"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Active background glow */}
              {isActive && (
                <motion.div
                  layoutId="nav-bg"
                  className="absolute inset-y-1 left-2 right-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <Icon
                className={`w-5 h-5 transition-colors relative z-10 ${
                  isActive ? tab.activeColor : 'text-muted-foreground'
                }`}
              />
              <span
                className={`text-[10px] font-semibold transition-colors relative z-10 ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
