'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Clock,
  CheckCircle2,
  ChevronRight,
  Play,
  SkipForward,
  Timer,
  Share2,
  Brain,
  AlertTriangle,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import {
  estimateStepDuration,
  getRandomWaitingMsg,
  getRandomPressureMsg,
  getRandomSkipMsg,
  playStartSound,
  playSkipSound,
  haptic,
} from '@/lib/motivation';

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
  if (diff <= 0) return 'NOW';
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

function formatCountdownPrecise(isoString: string): string {
  const now = new Date();
  const target = new Date(isoString);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return '0:00';
  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function CountdownTimer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire();
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [remaining <= 0, onExpire]);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = seconds > 0 ? (remaining / seconds) * 100 : 0;
  const isLow = remaining <= 10 && remaining > 0;
  const isCritical = remaining <= 5 && remaining > 0;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-primary-foreground/70 text-xs font-medium">
          {remaining <= 0 ? "Time's up!" : 'Time remaining'}
        </span>
        <span
          className={`text-xl font-semibold tabular-nums ${
            isCritical ? 'opacity-50' : isLow ? 'opacity-70' : ''
          }`}
        >
          {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
      </div>
      <div className="h-1.5 bg-primary-foreground/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary-foreground/80"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

export default function NowScreen() {
  const {
    alarms,
    waitingSession,
    setCurrentView,
    setShowCreateAlarm,
    getActiveTask,
    getNextTask,
    completeStep,
    skipStep,
    autoFlowEnabled,
    setAutoFlowEnabled,
    energyMode,
    todayCompletedSteps,
    todaySkippedSteps,
    getTotalScore,
    triggerStuckTask,
    setShowShareSheet,
  } = useStore();

  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showDelayRescue, setShowDelayRescue] = useState(false);
  const [skipMsg, setSkipMsg] = useState('');
  const [tick, setTick] = useState(0); // force re-render for live countdown
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFlowRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const waitingMsg = useMemo(() => getRandomWaitingMsg(), []);

  const activeTask = getActiveTask();
  const nextTask = getNextTask();
  const hasWaitingTasks =
    waitingSession?.isActive && waitingSession.tasks.some((t) => !t.isCompleted);

  // Live tick every second for countdowns
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Delay rescue: show after 2 min if task not started
  useEffect(() => {
    if (activeTask && !timerActive) {
      delayRef.current = setTimeout(() => {
        setShowDelayRescue(true);
        haptic('medium');
      }, 120000);
    }
    return () => {
      if (delayRef.current) clearTimeout(delayRef.current);
    };
  }, [activeTask?.step.id, timerActive]);

  // Time pressure: show urgent message when <5 min left
  const timePressure = useMemo(() => {
    if (!activeTask || timerActive) return null;
    const diff = new Date(activeTask.step.scheduledTime).getTime() - Date.now();
    if (diff > 0 && diff < 5 * 60 * 1000) {
      return { minutes: Math.floor(diff / 60000), msg: getRandomPressureMsg() };
    }
    return null;
  }, [activeTask?.step.id, timerActive, tick]);

  const handleTimerExpire = useCallback(() => {
    if (activeTask) {
      completeStep(activeTask.alarm.id, activeTask.step.id);
      setTimerActive(false);
      haptic('heavy');
    }
  }, [activeTask, completeStep]);

  const handleStart = () => {
    if (!activeTask) return;
    const estimated = estimateStepDuration(activeTask.step.label);
    const adjusted =
      energyMode === 'low'
        ? Math.max(1, Math.ceil(estimated / 2))
        : energyMode === 'high'
        ? Math.ceil(estimated * 0.7)
        : estimated;

    setTimerSeconds(adjusted * 60);
    setTimerActive(true);
    setShowDelayRescue(false);
    playStartSound();
    haptic('medium');
  };

  const handleSkip = () => {
    if (!activeTask) return;
    skipStep(activeTask.alarm.id, activeTask.step.id);
    setTimerActive(false);
    setShowDelayRescue(false);
    setSkipMsg(getRandomSkipMsg());
    playSkipSound();
    haptic('light');
    setTimeout(() => setSkipMsg(''), 3000);
  };

  const handleManualComplete = () => {
    if (!activeTask) return;
    completeStep(activeTask.alarm.id, activeTask.step.id);
    setTimerActive(false);
    setShowDelayRescue(false);
    haptic('heavy');
  };

  // Auto flow: auto-start timer for next step
  useEffect(() => {
    if (autoFlowEnabled && activeTask && !timerActive) {
      autoFlowRef.current = setTimeout(() => {
        handleStart();
      }, 1000);
    }
    return () => {
      if (autoFlowRef.current) clearTimeout(autoFlowRef.current);
    };
  }, [activeTask?.step.id, autoFlowEnabled, timerActive, handleStart]);

  const completedCount = alarms.reduce(
    (sum, a) => sum + a.steps.filter((s) => s.isCompleted).length,
    0
  );
  const totalCount = alarms.reduce((sum, a) => sum + a.steps.length, 0);
  const score = getTotalScore();

  // Build "Coming Up" list — next steps from all active alarms
  const comingUp = useMemo(() => {
    const upcoming: { alarm: typeof alarms[0]; step: typeof alarms[0]['steps'][0]; timeLabel: string }[] = [];
    for (const alarm of alarms) {
      if (!alarm.isActive) continue;
      const sorted = [...alarm.steps].sort((a, b) => a.stepOrder - b.stepOrder);
      for (const step of sorted) {
        if (!step.isCompleted) {
          const diff = new Date(step.scheduledTime).getTime() - Date.now();
          const timeLabel = diff <= 0 ? 'Overdue' : formatCountdown(step.scheduledTime);
          upcoming.push({ alarm, step, timeLabel });
          break; // only first incomplete step per alarm
        }
      }
    }
    return upcoming.slice(0, 4);
  }, [alarms, tick]);

  return (
    <div className="flex flex-col h-full">
      {/* Current Task */}
      <AnimatePresence mode="wait">
        {activeTask ? (
          <motion.div
            key={activeTask.step.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-4 mt-4"
          >
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Header */}
              <div className="bg-primary p-4 text-primary-foreground">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                    Current Step
                  </span>
                  {timerActive ? (
                    <span className="text-xs font-medium opacity-70">In Progress</span>
                  ) : (
                    <span className="text-xs font-medium opacity-70">
                      {formatCountdownPrecise(activeTask.step.scheduledTime)}
                    </span>
                  )}
                </div>

                <h1 className="text-lg font-semibold mb-1.5">
                  {activeTask.step.label}
                </h1>

                <div className="flex items-center gap-2 text-sm opacity-70">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatCountdown(activeTask.step.scheduledTime)}</span>
                  <span className="opacity-50">·</span>
                  <span>{activeTask.alarm.title}</span>
                </div>

                {/* Time pressure warning */}
                {timePressure && !timerActive && (
                  <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{timePressure.minutes} min remaining</span>
                  </div>
                )}

                {/* Timer */}
                {timerActive && (
                  <CountdownTimer seconds={timerSeconds} onExpire={handleTimerExpire} />
                )}

                {/* Progress */}
                <div className="mt-3 flex items-center gap-1">
                  {activeTask.alarm.steps
                    .sort((a, b) => a.stepOrder - b.stepOrder)
                    .map((s) => (
                      <div
                        key={s.id}
                        className={`h-1 rounded-full transition-all ${
                          s.isCompleted
                            ? 'bg-primary-foreground w-5'
                            : s.id === activeTask.step.id
                            ? 'bg-primary-foreground/70 w-5'
                            : 'bg-primary-foreground/20 w-2'
                        }`}
                      />
                    ))}
                </div>
              </div>

              {/* Actions */}
              <div className="p-3 flex gap-2">
                {!timerActive ? (
                  <>
                    <button
                      onClick={handleStart}
                      className="flex-1 bg-primary text-primary-foreground font-medium py-3 rounded-lg flex items-center justify-center gap-2 text-sm active:opacity-90 transition-opacity"
                    >
                      <Play className="w-4 h-4" />
                      Start
                    </button>
                    <button
                      onClick={handleSkip}
                      className="px-4 bg-secondary text-secondary-foreground font-medium py-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                      <SkipForward className="w-4 h-4" />
                      Skip
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleManualComplete}
                    className="flex-1 bg-primary text-primary-foreground font-medium py-3 rounded-lg flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Done
                  </button>
                )}
              </div>

              {/* Skip message */}
              <AnimatePresence>
                {skipMsg && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-muted-foreground text-center pb-3"
                  >
                    {skipMsg}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-4 mt-4"
          >
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-secondary flex items-center justify-center">
                <Zap className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="text-base font-semibold mb-1">No active tasks</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Create an alarm to get started
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowCreateAlarm(true)} size="sm">
                  Create Alarm
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentView('waiting')}
                >
                  Waiting Mode
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delay Rescue */}
      <AnimatePresence>
        {showDelayRescue && activeTask && !timerActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-4 mt-3"
          >
            <div className="bg-card rounded-lg border border-border p-3 flex items-center gap-3">
              <Timer className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm flex-1">Still stuck? Try a quick version.</p>
              <Button size="sm" variant="secondary" onClick={handleStart}>
                Go
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stuck Button */}
      {!timerActive && (
        <div className="mx-4 mt-3">
          <button
            onClick={() => {
              triggerStuckTask();
              haptic('medium');
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border active:bg-secondary transition-colors"
          >
            <Brain className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">I&apos;m Stuck</p>
              <p className="text-xs text-muted-foreground">Get a simple action</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Waiting Mode Banner */}
      {hasWaitingTasks && (
        <div className="mx-4 mt-3">
          <button
            onClick={() => setCurrentView('waiting')}
            className="w-full bg-card rounded-lg border border-border p-3 text-left flex items-center gap-3 active:bg-secondary transition-colors"
          >
            <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{waitingMsg}</p>
              <p className="text-xs text-muted-foreground truncate">
                {waitingSession!.tasks.filter((t) => !t.isCompleted).length} tasks until{' '}
                {waitingSession!.eventTitle}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-4 pt-4 pb-36 overflow-y-auto">
        {/* Coming Up */}
        {comingUp.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Coming Up
            </p>
            <div className="bg-card rounded-lg border border-border divide-y divide-border">
              {comingUp.map((item) => (
                <div
                  key={`${item.alarm.id}-${item.step.id}`}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.step.label}</p>
                    <p className="text-xs text-muted-foreground">{item.alarm.title}</p>
                  </div>
                  <span className={`text-xs tabular-nums flex-shrink-0 ${
                    item.timeLabel === 'Overdue' ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {item.timeLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress */}
        {(completedCount > 0 || todayCompletedSteps > 0) && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Progress
              </p>
              <button
                onClick={() => setShowShareSheet(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-card rounded-lg border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">
                  {completedCount}/{totalCount} steps
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {score} pts
                </span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full transition-all duration-500"
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              {todaySkippedSteps > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {todaySkippedSteps} skipped
                </p>
              )}
            </div>
          </div>
        )}

        {/* Auto Flow Toggle */}
        <div className="bg-card rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto Flow</p>
              <p className="text-xs text-muted-foreground">Start next step automatically</p>
            </div>
            <button
              onClick={() => setAutoFlowEnabled(!autoFlowEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                autoFlowEnabled ? 'bg-foreground' : 'bg-secondary'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow-sm transition-transform ${
                  autoFlowEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
