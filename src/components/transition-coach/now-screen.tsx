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
      {/* NOW BAR - iOS Card Style */}
      <AnimatePresence mode="wait">
        {activeTask ? (
          <motion.div
            key={activeTask.step.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mx-5 mt-4"
          >
            <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
              {/* Header */}
              <div className="bg-primary p-5 text-primary-foreground">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                      Now
                    </span>
                  </div>
                  {timerActive ? (
                    <span className="bg-primary-foreground/20 text-xs font-medium px-2.5 py-1 rounded-full">
                      In Progress
                    </span>
                  ) : (
                    <span className="bg-primary-foreground/10 text-xs font-medium px-2.5 py-1 rounded-full">
                      {formatCountdownPrecise(activeTask.step.scheduledTime)}
                    </span>
                  )}
                </div>

                <h1 className="text-xl font-semibold mb-2 text-balance">
                  {activeTask.step.label}
                </h1>

                <div className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatCountdown(activeTask.step.scheduledTime)}</span>
                  <span className="opacity-30">|</span>
                  <span>{activeTask.alarm.title}</span>
                </div>

                {/* Time pressure warning */}
                {timePressure && !timerActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 flex items-center gap-2 bg-primary-foreground/10 rounded-xl px-3 py-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">
                      {timePressure.minutes} min left
                    </span>
                  </motion.div>
                )}

                {/* Timer */}
                {timerActive && (
                  <CountdownTimer seconds={timerSeconds} onExpire={handleTimerExpire} />
                )}

                {/* Progress dots */}
                <div className="mt-4 flex items-center gap-1">
                  {activeTask.alarm.steps
                    .sort((a, b) => a.stepOrder - b.stepOrder)
                    .map((s) => (
                      <div
                        key={s.id}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          s.isCompleted
                            ? 'bg-primary-foreground w-6'
                            : s.id === activeTask.step.id
                            ? 'bg-primary-foreground/80 w-6'
                            : 'bg-primary-foreground/20 w-3'
                        }`}
                      />
                    ))}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 flex gap-3">
                {!timerActive ? (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStart}
                      className="flex-1 bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm active:bg-primary/90 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Start
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSkip}
                      className="px-5 bg-secondary text-secondary-foreground font-medium py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                      <SkipForward className="w-4 h-4" />
                      Skip
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleManualComplete}
                    className="flex-1 bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Done
                  </motion.button>
                )}
              </div>

              {/* Skip message feedback */}
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
            className="mx-5 mt-4"
          >
            <div className="bg-card rounded-3xl border border-border/50 p-8 text-center">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center"
              >
                <Zap className="w-7 h-7 text-primary" />
              </motion.div>
              <h2 className="text-lg font-semibold mb-1">Ready when you are</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Create an alarm or start waiting mode
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setShowCreateAlarm(true)}
                  className="rounded-2xl px-5"
                >
                  <Zap className="w-4 h-4 mr-1.5" />
                  Create Alarm
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentView('waiting')}
                  className="rounded-2xl px-5"
                >
                  <Clock className="w-4 h-4 mr-1.5" />
                  Waiting
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELAY RESCUE - iOS Style */}
      <AnimatePresence>
        {showDelayRescue && activeTask && !timerActive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-5 mt-3"
          >
            <div className="bg-card rounded-2xl border border-border/50 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Timer className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Still stuck?</p>
                <p className="text-xs text-muted-foreground">Try a quick 30 sec version</p>
              </div>
              <Button
                size="sm"
                onClick={handleStart}
                className="rounded-xl"
              >
                Go
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* I'M STUCK BUTTON - iOS Style */}
      {!timerActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mx-5 mt-3"
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              triggerStuckTask();
              haptic('medium');
            }}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 active:bg-secondary transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">I&apos;m Stuck</p>
              <p className="text-xs text-muted-foreground">Get one simple action to do now</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </motion.div>
      )}

      {/* WAITING MODE BANNER - iOS Style */}
      {hasWaitingTasks && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-5 mt-3"
        >
          <button
            onClick={() => setCurrentView('waiting')}
            className="w-full bg-card rounded-2xl border border-border/50 p-4 text-left flex items-center gap-3 active:bg-secondary transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{waitingMsg}</p>
              <p className="text-xs text-muted-foreground truncate">
                {waitingSession!.tasks.filter((t) => !t.isCompleted).length} tasks until{' '}
                {waitingSession!.eventTitle}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
        </motion.div>
      )}

      {/* Content area - iOS Style */}
      <div className="flex-1 px-5 pt-4 pb-40 overflow-y-auto">
        {/* COMING UP */}
        {comingUp.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Coming Up
            </p>
            <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/50">
              {comingUp.map((item) => (
                <div
                  key={`${item.alarm.id}-${item.step.id}`}
                  className="flex items-center gap-3 p-3.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.step.label}</p>
                    <p className="text-xs text-muted-foreground">{item.alarm.title}</p>
                  </div>
                  <span className={`text-xs font-medium tabular-nums flex-shrink-0 ${
                    item.timeLabel === 'Overdue' ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {item.timeLabel}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TODAY'S PROGRESS */}
        {(completedCount > 0 || todayCompletedSteps > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Today&apos;s Progress
              </p>
              <button
                onClick={() => setShowShareSheet(true)}
                className="text-muted-foreground active:text-foreground transition-colors p-1"
                title="Share your flow"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-card rounded-2xl border border-border/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">
                  {completedCount} of {totalCount} steps
                </p>
                <span className="text-sm font-semibold text-primary tabular-nums">
                  {score} pts
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
              {todaySkippedSteps > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {todaySkippedSteps} skipped (-{todaySkippedSteps * 3} pts)
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Auto Flow Toggle - iOS Style */}
        <div className="bg-card rounded-2xl border border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Auto Flow</p>
                <p className="text-xs text-muted-foreground">Auto-start next timer</p>
              </div>
            </div>
            <button
              onClick={() => setAutoFlowEnabled(!autoFlowEnabled)}
              className={`relative w-[51px] h-[31px] rounded-full transition-colors ${
                autoFlowEnabled ? 'bg-primary' : 'bg-secondary'
              }`}
            >
              <motion.div
                animate={{ x: autoFlowEnabled ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="absolute top-[2px] w-[27px] h-[27px] rounded-full bg-card shadow-sm"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
