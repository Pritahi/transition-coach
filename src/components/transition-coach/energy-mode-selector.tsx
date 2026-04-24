'use client';

import { motion } from 'framer-motion';
import { Battery, Zap, Flame } from 'lucide-react';
import { useStore, type EnergyMode } from '@/store/useStore';
import { haptic } from '@/lib/motivation';

const modes: { id: EnergyMode; icon: typeof Battery; label: string }[] = [
  { id: 'low', icon: Battery, label: 'Low' },
  { id: 'normal', icon: Zap, label: 'Normal' },
  { id: 'high', icon: Flame, label: 'High' },
];

export default function EnergyModeSelector() {
  const { energyMode, setEnergyMode } = useStore();

  const handleSelect = (mode: EnergyMode) => {
    setEnergyMode(mode);
    haptic('light');
  };

  return (
    <div className="flex p-1 bg-secondary rounded-xl">
      {modes.map((mode) => {
        const isActive = energyMode === mode.id;
        const Icon = mode.icon;

        return (
          <motion.button
            key={mode.id}
            onClick={() => handleSelect(mode.id)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="energy-pill"
                className="absolute inset-0 bg-card rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />
              {mode.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
