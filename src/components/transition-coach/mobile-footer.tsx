'use client';

import { useMemo } from 'react';
import { useStore } from '@/store/useStore';

export default function MobileFooter() {
  const { todayCompletedSteps, todaySkippedSteps, lastCompletionDate, getTotalScore } = useStore();
  const score = getTotalScore();

  // Calculate streak
  const streak = useMemo(() => {
    if (!lastCompletionDate || todayCompletedSteps === 0) return 0;
    return todayCompletedSteps;
  }, [lastCompletionDate, todayCompletedSteps]);

  // Total pending today
  const totalActions = todayCompletedSteps + todaySkippedSteps;
  const completionRate = totalActions > 0 ? Math.round((todayCompletedSteps / totalActions) * 100) : 0;

  return (
    <footer className="fixed bottom-[52px] left-0 right-0 z-40">
      <div className="max-w-lg mx-auto px-4 pb-2">
        {/* Stats Bar - iOS Card Style */}
        <div className="bg-card/90 backdrop-blur-xl rounded-2xl shadow-sm border border-border/30 px-4 py-3">
          <div className="flex items-center justify-around">
            {/* Steps */}
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-foreground tabular-nums">
                {todayCompletedSteps}
              </span>
              <span className="text-[10px] text-muted-foreground">Steps</span>
            </div>

            <div className="w-px h-8 bg-border/50" />

            {/* Score */}
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-foreground tabular-nums">
                {score}
              </span>
              <span className="text-[10px] text-muted-foreground">Score</span>
            </div>

            <div className="w-px h-8 bg-border/50" />

            {/* Streak */}
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-foreground tabular-nums">
                {streak}
              </span>
              <span className="text-[10px] text-muted-foreground">Streak</span>
            </div>

            <div className="w-px h-8 bg-border/50" />

            {/* Rate */}
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold text-foreground tabular-nums">
                {completionRate}%
              </span>
              <span className="text-[10px] text-muted-foreground">Rate</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
