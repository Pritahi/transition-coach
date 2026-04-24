'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Clock,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Play,
  SkipForward,
  Flame,
  Timer,
  Sparkles,
  Share2,
  Brain,
  AlertTriangle,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import {
  estimateStepDuration,
  getRandomEncouragement,
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
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-emerald-100 text-xs font-medium flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5" />
          {remaining <= 0 ? "Time's up!" : 'Time remaining'}
        </span>
        <span
          className={`text-lg font-mono font-bold tabular-nums ${
            isCritical ? 'text-red-200 animate-pulse' : isLow ? 'text-red-200' : 'text-white'
          }`}
        >
          {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
      </div>
      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full transition-colors ${
            isCritical ? 'bg-red-400' : isLow ? 'bg-amber-400' : 'bg-white/80'
          }`}
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
    deleteAlarm,
  } = useStore();

  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showDelayRescue, setShowDelayRescue] = useState(false);
  const [skipMsg, setSkipMsg] = useState('');
  const [tick, setTick] = useState(0); // force re-render for live countdown
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFlowRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Memoize the motivational message so it doesn't change on re-render
  const motivationalMsg = useMemo(() => getRandomEncouragement(), []);
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
      setShowDeleteConfirm(false);
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
    <div className="flex flex-col h-full overflow-y-auto">
      {/* HERO TAGLINE */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 pt-3 text-center"
      >
        <p className="text-xs font-semibold text-muted-foreground tracking-wide">
          Stop overthinking. Start next step.
        </p>
      </motion.div>

      {/* Motivational strip */}
      <motion.div
        key={motivationalMsg}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 pt-1"
      >
        <p className="text-[11px] text-muted-foreground/70 text-center italic">
          &ldquo;{motivationalMsg}&rdquo;
        </p>
      </motion.div>

      {/* NOW BAR */}
      <AnimatePresence mode="wait">
        {activeTask ? (
          <motion.div
            key={activeTask.step.id}
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden mx-4 mt-3"
          >
            <div
              className={`text-white p-5 rounded-2xl shadow-lg transition-colors ${
                timerActive
                  ? 'bg-emerald-600 shadow-emerald-600/25'
                  : 'bg-emerald-500 shadow-emerald-500/20'
              }`}
            >
              {!timerActive && (
                <div className="absolute inset-0 bg-emerald-400 rounded-2xl animate-pulse opacity-15" />
              )}

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 fill-current" />
                    <span className="text-emerald-100 text-sm font-bold uppercase tracking-wider">
                      NOW
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!timerActive && !showDeleteConfirm && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-90"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {timerActive ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full"
                      >
                        IN PROGRESS
                      </motion.span>
                    ) : (
                      <span className="bg-white/10 text-emerald-100 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {formatCountdownPrecise(activeTask.step.scheduledTime)}
                      </span>
                    )}
                </div>

                {/* Delete confirmation overlay */}
                <AnimatePresence>
                  {showDeleteConfirm && activeTask && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 bg-emerald-700/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-5 gap-2.5"
                    >
                      <Trash2 className="w-6 h-6 text-white/70" />
                      <p className="text-sm font-bold text-white">Delete this alarm?</p>
                      <p className="text-[11px] text-white/60">
                        &ldquo;{activeTask.alarm.title}&rdquo;
                      </p>
                      <div className="flex gap-2 w-full mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 h-9 rounded-xl text-xs bg-white/15 hover:bg-white/25 text-white border-0"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            deleteAlarm(activeTask.alarm.id);
                            setShowDeleteConfirm(false);
                            haptic('medium');
                          }}
                          className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <h1 className="text-2xl md:text-3xl font-extrabold mb-1">
                  {activeTask.step.label}
                </h1>

                {/* Time pressure + alarm context */}
                <div className="flex items-center gap-2 text-emerald-100">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium">
                    {formatCountdown(activeTask.step.scheduledTime)} to act
                  </span>
                  <span className="text-emerald-200/40">|</span>
                  <span className="text-sm">{activeTask.alarm.title}</span>
                </div>

                {/* Time pressure warning */}
                {timePressure && !timerActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                    <span className="text-xs font-bold text-amber-100">
                      Only {timePressure.minutes} min left!
                    </span>
                    <span className="text-[10px] text-emerald-200/70">
                      {timePressure.msg}
                    </span>
                  </motion.div>
                )}

                {/* Timer */}
                {timerActive && (
                  <CountdownTimer seconds={timerSeconds} onExpire={handleTimerExpire} />
                )}

                {/* Action buttons */}
                <div className="mt-4 flex gap-2">
                  {!timerActive ? (
                    <>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStart}
                        className="flex-1 bg-white text-emerald-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-emerald-50 transition-colors shadow-lg shadow-black/10"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        START NOW
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSkip}
                        className="px-3 bg-white/15 hover:bg-white/25 text-white font-medium py-3 rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          <SkipForward className="w-4 h-4" />
                          SKIP
                        </div>
                        <span className="text-[9px] text-emerald-200/50">-3 pts</span>
                      </motion.button>
                    </>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleManualComplete}
                      className="flex-1 bg-white text-emerald-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-emerald-50 transition-colors shadow-lg shadow-black/10"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      DONE — NEXT
                    </motion.button>
                  )}
                </div>

                {/* Skip message feedback */}
                <AnimatePresence>
                  {skipMsg && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-emerald-200/80 text-center mt-2 italic"
                    >
                      {skipMsg}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Progress dots */}
                <div className="mt-3 flex items-center gap-1.5">
                  {activeTask.alarm.steps
                    .sort((a, b) => a.stepOrder - b.stepOrder)
                    .map((s) => (
                      <motion.div
                        key={s.id}
                        animate={{ scale: s.id === activeTask.step.id ? 1.1 : 1 }}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          s.isCompleted
                            ? 'bg-white w-8'
                            : s.id === activeTask.step.id
                            ? 'bg-white/90 w-8'
                            : 'bg-white/30 w-4'
                        }`}
                      />
                    ))}
                </div>
              </div>
            </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-4 mt-3 space-y-3"
          >
            {/* Main empty state — simplified */}
            <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/20 rounded-2xl p-5 text-center">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
              >
                <Zap className="w-7 h-7 text-emerald-500" />
              </motion.div>
              <h2 className="text-lg font-bold mb-1">What should I do now?</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Create a smart alarm — we&apos;ll tell you exactly what to do next.
              </p>
              <Button
                onClick={() => setShowCreateAlarm(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
              >
                <Zap className="w-4 h-4 mr-1.5" />
                Create Smart Alarm
              </Button>
            </div>

            {/* Waiting Mode suggestion — Smart prompt */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setCurrentView('waiting')}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Got free time right now?
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Turn dead time into done time
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELAY RESCUE */}
      <AnimatePresence>
        {showDelayRescue && activeTask && !timerActive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-4 mt-3"
          >
            <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Still stuck?
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Try 30 sec version of &ldquo;{activeTask.step.label}&rdquo;
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleStart}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg h-8"
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                Go
              </Button>
              <button
                onClick={() => setShowDelayRescue(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* I'M STUCK BUTTON — Anti-overthinking */}
      {!timerActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mx-4 mt-3"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              triggerStuckTask();
              haptic('medium');
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-rose-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-rose-700 dark:text-rose-400">
                I&apos;m Stuck
              </p>
              <p className="text-[11px] text-muted-foreground">
                Tap and we&apos;ll give you one thing to do right now
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-rose-300" />
          </motion.button>
        </motion.div>
      )}

      {/* WAITING MODE BANNER */}
      {hasWaitingTasks && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-4 mt-3"
        >
          <button
            onClick={() => setCurrentView('waiting')}
            className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3.5 text-left flex items-center gap-3 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                {waitingMsg}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 truncate">
                {waitingSession!.tasks.filter((t) => !t.isCompleted).length} quick tasks until{' '}
                {waitingSession!.eventTitle}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
          </button>
        </motion.div>
      )}

      {/* Content area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* COMING UP — next steps from all alarms */}
        {comingUp.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Coming Up
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-2">
              {comingUp.map((item, i) => (
                <div
                  key={`${item.alarm.id}-${item.step.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.step.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.alarm.title}</p>
                  </div>
                  <span className={`text-xs font-medium tabular-nums flex-shrink-0 ${
                    item.timeLabel === 'Overdue' ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    {item.timeLabel}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TODAY'S PROGRESS — with score */}
        {(completedCount > 0 || todayCompletedSteps > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Today&apos;s Progress
              </span>
              <div className="flex-1 h-px bg-border" />
              <button
                onClick={() => setShowShareSheet(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Share your flow"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20">
              {todayCompletedSteps >= 3 ? (
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                    {completedCount} of {totalCount} steps done
                  </p>
                  {todayCompletedSteps >= 3 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-xs font-bold text-orange-600 dark:text-orange-400"
                    >
                      {todayCompletedSteps} today!
                    </motion.span>
                  )}
                </div>
                {/* Score */}
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex-1 h-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {score} pts
                  </span>
                </div>
                {/* Skip penalty indicator */}
                {todaySkippedSteps > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1"
                  >
                    <SkipForward className="w-3 h-3" />
                    {todaySkippedSteps} skipped today (-{todaySkippedSteps * 3} pts)
                  </motion.p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Auto Flow Toggle */}
        <div className="mt-5">
          <label className="flex items-center justify-between p-3 rounded-xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Auto Flow</p>
                <p className="text-xs text-muted-foreground">Auto-start next step timer</p>
              </div>
            </div>
            <button
              onClick={() => setAutoFlowEnabled(!autoFlowEnabled)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                autoFlowEnabled ? 'bg-emerald-500' : 'bg-muted-foreground/30'
              }`}
            >
              <motion.div
                animate={{ x: autoFlowEnabled ? 16 : 2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
              />
            </button>
          </label>
        </div>
      </div>
    </div>
  );
}
