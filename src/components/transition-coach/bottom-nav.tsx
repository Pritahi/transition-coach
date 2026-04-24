'use client';

import { Zap, Clock, Timer } from 'lucide-react';
import { useStore } from '@/store/useStore';

const tabs = [
  { id: 'now' as const, label: 'Now', icon: Zap, activeColor: 'text-primary' },
  { id: 'alarms' as const, label: 'Alarms', icon: Clock, activeColor: 'text-primary' },
  { id: 'waiting' as const, label: 'Wait', icon: Timer, activeColor: 'text-primary' },
];

export default function BottomNav() {
  const { currentView, setCurrentView, showStuckModal } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-2xl border-t border-border/50 safe-area-inset-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-[52px] px-6">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-transform active:scale-95"
            >
              <Icon
                className={`w-[22px] h-[22px] transition-colors ${
                  isActive ? tab.activeColor : 'text-muted-foreground/60'
                }`}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground/60'
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
