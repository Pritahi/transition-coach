'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Clock,
  Trash2,
  ChevronDown,
  CheckCircle2,
  Circle,
  Zap,
  Play,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { estimateStepDuration, playStartSound, haptic } from '@/lib/motivation';

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatCountdown(isoString: string): string {
  const now = new Date();
  const target = new Date(isoString);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'Now';
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

function getStepStatus(alarm: ReturnType<typeof useStore.getState>['alarms'][0]) {
  const completed = alarm.steps.filter((s) => s.isCompleted).length;
  const total = alarm.steps.length;
  if (completed === total && total > 0) return 'completed';
  if (completed > 0) return 'in-progress';
  return 'pending';
}

export default function AlarmsList() {
  const {
    alarms,
    deleteAlarm,
    toggleAlarm,
    completeStep,
    uncompleteStep,
    setShowCreateAlarm,
    setCurrentView,
  } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedAlarms = useMemo(
    () =>
      [...alarms].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return new Date(a.finalTime).getTime() - new Date(b.finalTime).getTime();
      }),
    [alarms],
  );

  const activeAlarms = sortedAlarms.filter((a) => a.isActive && getStepStatus(a) !== 'completed');
  const otherAlarms = sortedAlarms.filter(
    (a) => !a.isActive || getStepStatus(a) === 'completed',
  );
  const nextAlarm = activeAlarms[0] || null;

  const handleStartAlarm = (alarmId: string) => {
    setCurrentView('now');
    playStartSound();
    haptic('medium');
  };

  const handleCompleteStep = (alarmId: string, stepId: string) => {
    completeStep(alarmId, stepId);
    haptic('heavy');
  };

  const handleUncompleteStep = (alarmId: string, stepId: string) => {
    uncompleteStep(alarmId, stepId);
    haptic('light');
  };

  // --- Empty State ---
  if (sortedAlarms.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 pb-2">
          <h2 className="text-xl font-bold">Smart Alarms</h2>
          <p className="text-sm text-muted-foreground">Your flows live here</p>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/20 flex items-center justify-center"
            >
              <Zap className="w-10 h-10 text-emerald-400" />
            </motion.div>
            <h3 className="text-lg font-bold mb-1">No alarms yet</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-[240px] mx-auto leading-relaxed">
              Create one smart alarm with steps and let the app tell you exactly what to do next.
            </p>
            <Button
              onClick={() => setShowCreateAlarm(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
              size="lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              Create Your First Flow
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div>
          <h2 className="text-xl font-bold">Alarms</h2>
          <p className="text-sm text-muted-foreground">
            {activeAlarms.length} active
          </p>
        </div>
        <Button
          onClick={() => setShowCreateAlarm(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full w-10 h-10 p-0 shadow-lg shadow-emerald-500/25"
          size="icon"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {/* NEXT ALARM — Hero Card */}
        {nextAlarm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-500" />
              Up Next
            </p>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-4 rounded-2xl shadow-lg shadow-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">{nextAlarm.title}</h3>
                <span className="bg-white/20 text-xs font-bold px-2.5 py-1 rounded-full">
                  {formatCountdown(nextAlarm.finalTime)}
                </span>
              </div>

              {/* Step flow preview */}
              <div className="flex items-center gap-1 mb-3 flex-wrap">
                {nextAlarm.steps
                  .sort((a, b) => a.stepOrder - b.stepOrder)
                  .map((s, i) => (
                    <div key={s.id} className="flex items-center gap-1">
                      <span className="text-xs font-medium flex items-center gap-0.5">
                        {s.isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                        ) : null}
                        {s.label}
                      </span>
                      {i < nextAlarm.steps.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-white/40" />
                      )}
                    </div>
                  ))}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 text-emerald-100 text-xs mb-3">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(nextAlarm.finalTime)}</span>
              </div>

              {/* Start Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStartAlarm(nextAlarm.id)}
                className="w-full bg-white text-emerald-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-black/10"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Now
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* OTHER ALARMS — Compact List */}
        {otherAlarms.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Other Alarms
            </p>
            <div className="space-y-2">
              {otherAlarms.map((alarm) => {
                const isExpanded = expandedId === alarm.id;
                const status = getStepStatus(alarm);
                const completedCount = alarm.steps.filter((s) => s.isCompleted).length;
                const sortedSteps = [...alarm.steps].sort((a, b) => a.stepOrder - b.stepOrder);
                const nextIncomplete = sortedSteps.find((s) => !s.isCompleted);

                return (
                  <motion.div
                    key={alarm.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`rounded-xl border transition-colors ${
                      !alarm.isActive
                        ? 'border-muted bg-muted/30 opacity-60'
                        : status === 'completed'
                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/30 dark:bg-emerald-900/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : alarm.id)}
                      className="w-full p-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                            status === 'completed'
                              ? 'bg-emerald-500 text-white'
                              : status === 'in-progress'
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {status === 'completed' ? (
                            <BadgeCheck className="w-4 h-4" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold truncate">{alarm.title}</h3>
                            {!alarm.isActive && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                Off
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(alarm.finalTime)}</span>
                            {status === 'in-progress' && (
                              <span className="font-medium text-amber-600 dark:text-amber-400">
                                {completedCount}/{alarm.steps.length}
                              </span>
                            )}
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </motion.div>
                      </div>
                    </button>

                    {/* Expanded Steps */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3">
                            {/* Progress */}
                            <div className="mb-2">
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${alarm.steps.length > 0 ? (completedCount / alarm.steps.length) * 100 : 0}%`,
                                  }}
                                  className={`h-full rounded-full ${
                                    status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Steps */}
                            <div className="space-y-0.5">
                              {sortedSteps.map((step) => (
                                <button
                                  key={step.id}
                                  onClick={() =>
                                    step.isCompleted
                                      ? handleUncompleteStep(alarm.id, step.id)
                                      : handleCompleteStep(alarm.id, step.id)
                                  }
                                  className="flex items-center gap-2 w-full p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                                >
                                  {step.isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <span
                                    className={`text-sm flex-1 ${
                                      step.isCompleted ? 'text-muted-foreground line-through' : ''
                                    }`}
                                  >
                                    {step.label}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatTime(step.scheduledTime)}
                                  </span>
                                </button>
                              ))}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAlarm(alarm.id);
                                  haptic('light');
                                }}
                                className="text-muted-foreground h-8 text-xs"
                              >
                                {alarm.isActive ? 'Pause' : 'Resume'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteAlarm(alarm.id);
                                  haptic('light');
                                }}
                                className="text-destructive hover:text-destructive h-8 text-xs"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Extra active alarms beyond the next one */}
        {activeAlarms.length > 1 && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Later Today
            </p>
            <div className="space-y-2">
              {activeAlarms.slice(1).map((alarm) => {
                const isExpanded = expandedId === alarm.id;
                const sortedSteps = [...alarm.steps].sort((a, b) => a.stepOrder - b.stepOrder);
                const nextIncomplete = sortedSteps.find((s) => !s.isCompleted);

                return (
                  <motion.div
                    key={alarm.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card"
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : alarm.id)}
                      className="w-full p-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate">{alarm.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(alarm.finalTime)}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              ({formatCountdown(alarm.finalTime)})
                            </span>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </motion.div>
                      </div>
                    </button>

                    {/* Quick start button when collapsed */}
                    {!isExpanded && nextIncomplete && (
                      <div className="px-3 pb-2">
                        <Button
                          size="sm"
                          onClick={() => handleStartAlarm(alarm.id)}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-8 text-xs rounded-lg"
                        >
                          <Play className="w-3.5 h-3.5 mr-1 fill-current" />
                          Start Now — {nextIncomplete.label}
                        </Button>
                      </div>
                    )}

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3">
                            <div className="space-y-0.5">
                              {sortedSteps.map((step) => (
                                <button
                                  key={step.id}
                                  onClick={() =>
                                    step.isCompleted
                                      ? handleUncompleteStep(alarm.id, step.id)
                                      : handleCompleteStep(alarm.id, step.id)
                                  }
                                  className="flex items-center gap-2 w-full p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
                                >
                                  {step.isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  )}
                                  <span className={`text-sm flex-1 ${step.isCompleted ? 'text-muted-foreground' : ''}`}>
                                    {step.label}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatTime(step.scheduledTime)}
                                  </span>
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAlarm(alarm.id);
                                  haptic('light');
                                }}
                                className="text-muted-foreground h-8 text-xs"
                              >
                                Pause
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteAlarm(alarm.id);
                                  haptic('light');
                                }}
                                className="text-destructive hover:text-destructive h-8 text-xs"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
