'use client';

import { motion } from 'framer-motion';
import { Battery, Zap, Flame } from 'lucide-react';
import { useStore, type EnergyMode } from '@/store/useStore';
import { energyMessages } from '@/lib/motivation';
import { haptic } from '@/lib/motivation';

const modes: { id: EnergyMode; icon: typeof Battery; activeClass: string }[] = [
  {
    id: 'low',
    icon: Battery,
    activeClass: 'bg-sky-500/10 border-sky-400/40 text-sky-600 dark:text-sky-400',
  },
  {
    id: 'normal',
    icon: Zap,
    activeClass: 'bg-emerald-500/10 border-emerald-400/40 text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'high',
    icon: Flame,
    activeClass: 'bg-orange-500/10 border-orange-400/40 text-orange-600 dark:text-orange-400',
  },
];

export default function EnergyModeSelector() {
  const { energyMode, setEnergyMode } = useStore();

  const handleSelect = (mode: EnergyMode) => {
    setEnergyMode(mode);
    haptic('light');
  };

  return (
    <div className="flex gap-1.5 p-0.5 bg-muted/40 rounded-xl">
      {modes.map((mode) => {
        const isActive = energyMode === mode.id;
        const Icon = mode.icon;
        const meta = energyMessages[mode.id];

        return (
          <motion.button
            key={mode.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleSelect(mode.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] border transition-all ${
              isActive
                ? `${mode.activeClass} border`
                : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
            }`}
          >
            <span className="text-[13px]">{meta.emoji}</span>
            <Icon className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">{meta.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
