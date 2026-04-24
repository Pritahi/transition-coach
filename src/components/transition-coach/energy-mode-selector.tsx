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
    activeClass: 'border-b-2 border-black text-gray-900 font-bold',
  },
  {
    id: 'normal',
    icon: Zap,
    activeClass: 'border-b-2 border-black text-gray-900 font-bold',
  },
  {
    id: 'high',
    icon: Flame,
    activeClass: 'border-b-2 border-orange-500 text-orange-700 font-bold',
  },
];

export default function EnergyModeSelector() {
  const { energyMode, setEnergyMode } = useStore();

  const handleSelect = (mode: EnergyMode) => {
    setEnergyMode(mode);
    haptic('light');
  };

  return (
    <div className="flex gap-1.5 p-0.5 bg-gray-50 rounded-xl">
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
                ? `${mode.activeClass}`
                : 'border-b-2 border-transparent text-gray-400 hover:text-gray-600'
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
