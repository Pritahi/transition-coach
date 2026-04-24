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
  MoreVertical,
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

function ConfirmDelete({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 gap-3"
    >
      <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        <Trash2 className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-sm font-bold text-center">Delete this alarm?</p>
      <p className="text-xs text-muted-foreground text-center">
        This can&apos;t be undone
      </p>
      <div className="flex gap-2 w-full mt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="flex-1 h-9 rounded-xl text-xs"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Delete
        </Button>
      </div>
    </motion.div>
  );
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  const handleDelete = (alarmId: string) => {
    deleteAlarm(alarmId);
    setConfirmDeleteId(null);
    if (expandedId === alarmId) setExpandedId(null);
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
      <div className="flex flex-col">
        <div className="p-4 pb-2">
          <h2 className="text-xl font-bold">Alarms</h2>
          <p className="text-sm text-muted-foreground">Your flows live here</p>
        </div>
        <div className="flex items-center justify-center px-4 min-h-[50vh]">
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
    <div className="flex flex-col">
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

      <div className="px-4 pb-4 space-y-3">
        {/* NEXT ALARM — Hero Card with Delete */}
        {nextAlarm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-500" />
              Up Next
            </p>
            <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-4 rounded-2xl shadow-lg shadow-emerald-500/20">
              {/* Delete button — top right corner */}
              <button
                onClick={() => setConfirmDeleteId(nextAlarm.id)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors active:scale-90 z-10"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="pr-10 mb-2">
                <h3 className="font-bold text-lg pr-8">{nextAlarm.title}</h3>
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
                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full ml-auto">
                  {formatCountdown(nextAlarm.finalTime)}
                </span>
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

              {/* Confirm Delete Overlay */}
              <AnimatePresence>
                {confirmDeleteId === nextAlarm.id && (
                  <ConfirmDelete
                    onConfirm={() => handleDelete(nextAlarm.id)}
                    onCancel={() => setConfirmDeleteId(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* OTHER ALARMS — Compact List with swipe-style delete */}
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

                return (
                  <motion.div
                    key={alarm.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`rounded-2xl border transition-colors relative overflow-hidden ${
                      !alarm.isActive
                        ? 'border-muted bg-muted/30 opacity-60'
                        : status === 'completed'
                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/30 dark:bg-emerald-900/10'
                        : 'border-border bg-card'
                    }`}
                  >
                    {/* Confirm overlay */}
                    <AnimatePresence>
                      {confirmDeleteId === alarm.id && (
                        <ConfirmDelete
                          onConfirm={() => handleDelete(alarm.id)}
                          onCancel={() => setConfirmDeleteId(null)}
                        />
                      )}
                    </AnimatePresence>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : alarm.id)}
                      className="w-full p-3.5 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                            status === 'completed'
                              ? 'bg-emerald-500 text-white'
                              : status === 'in-progress'
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {status === 'completed' ? (
                            <BadgeCheck className="w-4.5 h-4.5" />
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
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(alarm.finalTime)}</span>
                            {status === 'in-progress' && (
                              <span className="font-medium text-amber-600 dark:text-amber-400">
                                {completedCount}/{alarm.steps.length}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Delete icon */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(alarm.id);
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-90 transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                          <div className="px-3.5 pb-3.5">
                            {/* Progress */}
                            <div className="mb-2.5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] text-muted-foreground">
                                  {completedCount}/{alarm.steps.length} done
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {alarm.steps.length > 0 ? Math.round((completedCount / alarm.steps.length) * 100) : 0}%
                                </span>
                              </div>
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
                                  className="flex items-center gap-2.5 w-full p-2 rounded-xl hover:bg-muted/50 transition-colors text-left"
                                >
                                  {step.isCompleted ? (
                                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-4.5 h-4.5 text-muted-foreground/50 flex-shrink-0" />
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
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAlarm(alarm.id);
                                  haptic('light');
                                }}
                                className="text-muted-foreground h-8 text-xs rounded-lg"
                              >
                                {alarm.isActive ? 'Pause' : 'Resume'}
                              </Button>
                              <div className="flex-1" />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(alarm.id);
                                  haptic('light');
                                }}
                                className="text-destructive hover:text-destructive h-8 text-xs rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Delete
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
                    className="rounded-2xl border border-border bg-card relative overflow-hidden"
                  >
                    {/* Confirm overlay */}
                    <AnimatePresence>
                      {confirmDeleteId === alarm.id && (
                        <ConfirmDelete
                          onConfirm={() => handleDelete(alarm.id)}
                          onCancel={() => setConfirmDeleteId(null)}
                        />
                      )}
                    </AnimatePresence>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : alarm.id)}
                      className="w-full p-3.5 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold truncate">{alarm.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(alarm.finalTime)}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              ({formatCountdown(alarm.finalTime)})
                            </span>
                          </div>
                        </div>
                        {/* Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(alarm.id);
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-90 transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                      <div className="px-3.5 pb-3">
                        <Button
                          size="sm"
                          onClick={() => handleStartAlarm(alarm.id)}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-9 text-xs rounded-xl"
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
                          <div className="px-3.5 pb-3.5">
                            <div className="space-y-0.5">
                              {sortedSteps.map((step) => (
                                <button
                                  key={step.id}
                                  onClick={() =>
                                    step.isCompleted
                                      ? handleUncompleteStep(alarm.id, step.id)
                                      : handleCompleteStep(alarm.id, step.id)
                                  }
                                  className="flex items-center gap-2.5 w-full p-2 rounded-xl hover:bg-muted/50 transition-colors text-left"
                                >
                                  {step.isCompleted ? (
                                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-4.5 h-4.5 text-muted-foreground/50 flex-shrink-0" />
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
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAlarm(alarm.id);
                                  haptic('light');
                                }}
                                className="text-muted-foreground h-8 text-xs rounded-lg"
                              >
                                Pause
                              </Button>
                              <div className="flex-1" />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(alarm.id);
                                  haptic('light');
                                }}
                                className="text-destructive hover:text-destructive h-8 text-xs rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Delete
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
