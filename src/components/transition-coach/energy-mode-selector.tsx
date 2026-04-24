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
    activeClass: 'border-emerald-500 text-emerald-700 font-bold bg-emerald-50',
  },
  {
    id: 'normal',
    icon: Zap,
    activeClass: 'border-emerald-500 text-emerald-700 font-bold bg-emerald-50',
  },
  {
    id: 'high',
    icon: Flame,
    activeClass: 'border-orange-500 text-orange-700 font-bold bg-orange-50',
  },
];

export default function EnergyModeSelector() {
  const { energyMode, setEnergyMode } = useStore();

  const handleSelect = (mode: EnergyMode) => {
    setEnergyMode(mode);
    haptic('light');
  };

  return (
    <div className="flex gap-1.5 p-0.5 bg-white/60 rounded-xl border border-gray-200/60">
      {modes.map((mode) => {
        const isActive = energyMode === mode.id;
        const Icon = mode.icon;
        const meta = energyMessages[mode.id];

        return (
          <motion.button
            key={mode.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleSelect(mode.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] border-2 transition-all ${
              isActive
                ? `${mode.activeClass}`
                : 'border-transparent text-gray-400 hover:text-gray-600'
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
