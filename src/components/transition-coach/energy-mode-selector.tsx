'use client';

import { useStore, type EnergyMode } from '@/store/useStore';
import { haptic } from '@/lib/motivation';

const modes: { id: EnergyMode; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'High' },
];

export default function EnergyModeSelector() {
  const { energyMode, setEnergyMode } = useStore();

  const handleSelect = (mode: EnergyMode) => {
    setEnergyMode(mode);
    haptic('light');
  };

  return (
    <div className="flex p-0.5 bg-secondary rounded-lg">
      {modes.map((mode) => {
        const isActive = energyMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => handleSelect(mode.id)}
            className={`relative flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
