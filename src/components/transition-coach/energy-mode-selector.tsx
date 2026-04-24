'use client';

import { motion } from 'framer-motion';
import { Battery, Zap, Flame } from 'lucide-react';
import { useStore, type EnergyMode } from '@/store/useStore';
import { energyMessages } from '@/lib/motivation';
import { haptic } from '@/lib/motivation';

const modes: { id: EnergyMode; icon: typeof Battery; color: string; bg: string; ring: string }[] = [
  {
    id: 'low',
    icon: Battery,
    color: 'text-sky-500',
    bg: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800/30',
    ring: 'ring-sky-500/30',
  },
  {
    id: 'normal',
    icon: Zap,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30',
    ring: 'ring-emerald-500/30',
  },
  {
    id: 'high',
    icon: Flame,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/30',
    ring: 'ring-orange-500/30',
  },
];

export default function EnergyModeSelector() {
  const { energyMode, setEnergyMode } = useStore();

  const handleSelect = (mode: EnergyMode) => {
    setEnergyMode(mode);
    haptic('light');
  };

  return (
    <div className="flex gap-1.5">
      {modes.map((mode) => {
        const isActive = energyMode === mode.id;
        const Icon = mode.icon;
        const meta = energyMessages[mode.id];

        return (
          <motion.button
            key={mode.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(mode.id)}
            className={`flex-1 flex items-center gap-1.5 p-2 rounded-lg border transition-all ${
              isActive
                ? `${mode.bg} ring-2 ring-offset-1 ${mode.ring} shadow-sm`
                : 'border-transparent bg-muted/20 hover:bg-muted/40'
            }`}
          >
            <span className="text-base">{meta.emoji}</span>
            <Icon className={`w-3.5 h-3.5 ${isActive ? mode.color : 'text-muted-foreground'}`} />
            <span className={`text-[10px] font-semibold ${isActive ? mode.color : 'text-muted-foreground'}`}>
              {meta.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
