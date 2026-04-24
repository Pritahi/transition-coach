'use client';

import { motion } from 'framer-motion';
import { Zap, Clock, Timer } from 'lucide-react';
import { useStore } from '@/store/useStore';

const tabs = [
  { id: 'now' as const, label: 'Now', icon: Zap },
  { id: 'alarms' as const, label: 'Alarms', icon: Clock },
  { id: 'waiting' as const, label: 'Wait', icon: Timer },
];

export default function BottomNav() {
  const { currentView, setCurrentView } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-t border-border/40 safe-area-inset-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-[50px] px-2">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className="relative flex flex-col items-center justify-center w-full h-full gap-0.5 active:scale-95 transition-transform"
            >
              <Icon
                className={`w-[22px] h-[22px] transition-colors ${
                  isActive ? 'text-emerald-500' : 'text-muted-foreground/50'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-emerald-500' : 'text-muted-foreground/50'
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
