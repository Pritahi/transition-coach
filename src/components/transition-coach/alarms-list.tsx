'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Clock,
  Trash2,
  Power,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Zap,
  ArrowRight,
  Flame,
  Play,
  BadgeCheck,
  Sparkles,
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

  const sortedAlarms = useMemo(() => [...alarms].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return new Date(a.finalTime).getTime() - new Date(b.finalTime).getTime();
  }), [alarms]);

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div>
          <h2 className="text-lg font-semibold">Alarms</h2>
          <p className="text-sm text-muted-foreground">
            {alarms.filter((a) => a.isActive).length} active
          </p>
        </div>
        <Button
          onClick={() => setShowCreateAlarm(true)}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {sortedAlarms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/20 flex items-center justify-center mb-5"
            >
              <Clock className="w-12 h-12 text-emerald-400" />
            </motion.div>
            <h3 className="text-xl font-bold mb-2">No alarms yet</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Turn your chaos into a clear flow
            </p>
            <p className="text-xs text-muted-foreground/80 mb-6 max-w-[260px] leading-relaxed">
              Instead of 500 random alarms, create one smart alarm with 5 action steps. 
              Each step has a deadline, so you know exactly what to do next.
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
        ) : (
          <AnimatePresence>
            {sortedAlarms.map((alarm) => {
              const isExpanded = expandedId === alarm.id;
              const status = getStepStatus(alarm);
              const completedCount = alarm.steps.filter((s) => s.isCompleted).length;
              const sortedSteps = [...alarm.steps].sort((a, b) => a.stepOrder - b.stepOrder);
              const totalEstimated = sortedSteps.reduce(
                (sum, s) => sum + estimateStepDuration(s.label),
                0
              );
              const nextIncomplete = sortedSteps.find((s) => !s.isCompleted);

              return (
                <motion.div
                  key={alarm.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-xl border transition-colors ${
                    !alarm.isActive
                      ? 'border-muted bg-muted/30 opacity-60'
                      : status === 'completed'
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/30 dark:bg-emerald-900/10'
                      : 'border-border bg-card'
                  }`}
                >
                  {/* Alarm Header — with flow preview */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : alarm.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          status === 'completed'
                            ? 'bg-emerald-500 text-white'
                            : status === 'in-progress'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {status === 'completed' ? (
                          <BadgeCheck className="w-5 h-5" />
                        ) : (
                          <Zap className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{alarm.title}</h3>
                          {!alarm.isActive && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              Off
                            </Badge>
                          )}
                          {status === 'completed' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <Badge className="text-xs px-1.5 py-0 bg-emerald-500 text-white border-0">
                                <Sparkles className="w-3 h-3 mr-0.5" />
                                Done
                              </Badge>
                            </motion.div>
                          )}
                        </div>

                        {/* Flow preview */}
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {sortedSteps.map((s, i) => (
                            <div key={s.id} className="flex items-center gap-1">
                              <span
                                className={`text-xs font-medium transition-colors ${
                                  s.isCompleted
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {s.isCompleted ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 inline mr-0.5" />
                                ) : null}
                                {s.label}
                              </span>
                              {i < sortedSteps.length - 1 && (
                                <ArrowRight className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(alarm.finalTime)}
                            {status !== 'completed' && alarm.isActive && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                ({formatCountdown(alarm.finalTime)})
                              </span>
                            )}
                          </span>
                          <span className="text-muted-foreground/30">·</span>
                          <span className="text-xs text-muted-foreground">
                            ~{totalEstimated} min
                          </span>
                          {status === 'in-progress' && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                {completedCount}/{alarm.steps.length}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      </motion.div>
                    </div>
                  </button>

                  {/* START NOW button — always visible when active & not complete */}
                  {alarm.isActive && status !== 'completed' && !isExpanded && nextIncomplete && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="px-4 pb-3"
                    >
                      <Button
                        onClick={() => handleStartAlarm(alarm.id)}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg h-9"
                      >
                        <Play className="w-4 h-4 mr-1.5 fill-current" />
                        Start Now — {nextIncomplete.label}
                      </Button>
                    </motion.div>
                  )}

                  {/* Expanded Steps */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          {/* Progress bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">
                                {completedCount} of {alarm.steps.length} done
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {alarm.steps.length > 0 ? Math.round((completedCount / alarm.steps.length) * 100) : 0}%
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${alarm.steps.length > 0 ? (completedCount / alarm.steps.length) * 100 : 0}%`,
                                }}
                                transition={{ duration: 0.4 }}
                                className={`h-full rounded-full ${
                                  status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                              />
                            </div>
                          </div>

                          <div className="border-t border-border pt-3 space-y-1">
                            {sortedSteps.map((step, index) => {
                              const isLast = index === sortedSteps.length - 1;
                              const est = estimateStepDuration(step.label);

                              return (
                                <motion.div
                                  key={step.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="flex gap-3"
                                >
                                  {/* Timeline */}
                                  <div className="flex flex-col items-center">
                                    <button
                                      onClick={() =>
                                        step.isCompleted
                                          ? handleUncompleteStep(alarm.id, step.id)
                                          : handleCompleteStep(alarm.id, step.id)
                                      }
                                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                        step.isCompleted
                                          ? 'bg-emerald-500 text-white scale-110'
                                          : 'bg-muted hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-muted-foreground hover:text-emerald-500'
                                      }`}
                                    >
                                      {step.isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                      ) : (
                                        <Circle className="w-5 h-5" />
                                      )}
                                    </button>
                                    {!isLast && (
                                      <div
                                        className={`w-0.5 flex-1 my-0.5 transition-colors ${
                                          step.isCompleted
                                            ? 'bg-emerald-300 dark:bg-emerald-700'
                                            : 'bg-border'
                                        }`}
                                      />
                                    )}
                                  </div>

                                  {/* Step content — badge instead of strikethrough */}
                                  <button
                                    onClick={() =>
                                      step.isCompleted
                                        ? handleUncompleteStep(alarm.id, step.id)
                                        : handleCompleteStep(alarm.id, step.id)
                                    }
                                    className="flex-1 text-left py-1.5"
                                  >
                                    <div className="flex items-center gap-2">
                                      <p
                                        className={`text-sm font-medium transition-colors ${
                                          step.isCompleted ? 'text-muted-foreground' : ''
                                        }`}
                                      >
                                        {step.label}
                                      </p>
                                      {step.isCompleted && (
                                        <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-0 font-medium">
                                          Completed
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs text-muted-foreground">
                                        {formatTime(step.scheduledTime)}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground/60">
                                        ~{est} min
                                      </span>
                                      {!step.isCompleted && (
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                          Tap to complete
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                </motion.div>
                              );
                            })}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAlarm(alarm.id);
                                haptic('light');
                              }}
                              className="text-muted-foreground"
                            >
                              <Power className="w-4 h-4 mr-1" />
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
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
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
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
