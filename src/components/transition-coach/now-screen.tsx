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
  Trophy,
  Lightbulb,
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

function getCurrentTimeDisplay(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
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
        <span className="text-emerald-600/70 text-xs font-medium flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5" />
          {remaining <= 0 ? "Time's up!" : 'Time remaining'}
        </span>
        <span
          className={`text-lg font-mono font-bold tabular-nums ${
            isCritical ? 'text-red-500 animate-pulse' : isLow ? 'text-amber-500' : 'text-emerald-700'
          }`}
        >
          {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
      </div>
      <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full transition-colors ${
            isCritical ? 'bg-red-400' : isLow ? 'bg-amber-400' : 'bg-emerald-500'
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
  } = useStore();

  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showDelayRescue, setShowDelayRescue] = useState(false);
  const [skipMsg, setSkipMsg] = useState('');
  const [tick, setTick] = useState(0);
  const [currentTime, setCurrentTime] = useState(getCurrentTimeDisplay());
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFlowRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const motivationalMsg = useMemo(() => getRandomEncouragement(), []);
  const waitingMsg = useMemo(() => getRandomWaitingMsg(), []);

  const activeTask = getActiveTask();
  const nextTask = getNextTask();
  const hasWaitingTasks =
    waitingSession?.isActive && waitingSession.tasks.some((t) => !t.isCompleted);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setCurrentTime(getCurrentTimeDisplay());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
  const streak = todayCompletedSteps;
  const totalActions = todayCompletedSteps + todaySkippedSteps;
  const completionRate = totalActions > 0 ? Math.round((todayCompletedSteps / totalActions) * 100) : 0;

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
          break;
        }
      }
    }
    return upcoming.slice(0, 4);
  }, [alarms, tick]);

  // Completed steps for checklist display
  const completedStepsList = useMemo(() => {
    const steps: { label: string; alarmTitle: string }[] = [];
    for (const alarm of alarms) {
      for (const step of alarm.steps) {
        if (step.isCompleted) {
          steps.push({ label: step.label, alarmTitle: alarm.title });
        }
      }
    }
    return steps.slice(0, 5);
  }, [alarms]);

  return (
    <div className="flex flex-col">
      {/* MOTIVATIONAL BANNER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4"
      >
        <p className="text-emerald-700 font-bold text-sm">Action over overthinking</p>
        <p className="text-emerald-600/70 text-xs mt-0.5">Small steps. Big progress.</p>
        <p className="text-emerald-500/50 text-[10px] mt-1">{currentTime} • Today</p>
      </motion.div>

      {/* Motivational strip */}
      <motion.div
        key={motivationalMsg}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 pt-2"
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
            {/* NEXT TINY STEP Card - White with green accent */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 relative">
              {!timerActive && (
                <div className="absolute top-5 left-5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              )}

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 pl-5">
                    <span className="text-emerald-600 text-[11px] font-bold uppercase tracking-wider">
                      NEXT TINY STEP
                    </span>
                  </div>
                  {timerActive ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full"
                    >
                      IN PROGRESS
                    </motion.span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {formatCountdownPrecise(activeTask.step.scheduledTime)}
                    </span>
                  )}
                </div>

                <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1 pl-5">
                  {activeTask.step.label}
                </h1>

                {/* Time estimate and context */}
                <div className="flex items-center gap-2 text-gray-500 pl-5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium">
                    Takes 2 min. Build momentum.
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-sm text-gray-400">{activeTask.alarm.title}</span>
                </div>

                {/* Time pressure warning */}
                {timePressure && !timerActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-amber-700">
                      Only {timePressure.minutes} min left!
                    </span>
                    <span className="text-[10px] text-amber-600/60">
                      {timePressure.msg}
                    </span>
                  </motion.div>
                )}

                {/* Timer */}
                {timerActive && (
                  <CountdownTimer seconds={timerSeconds} onExpire={handleTimerExpire} />
                )}

                {/* Action buttons */}
                <div className="mt-4 flex gap-2 pl-5">
                  {!timerActive ? (
                    <>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStart}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors shadow-sm shadow-emerald-500/20"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        Do it now
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSkip}
                        className="px-4 border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium py-3 rounded-xl flex flex-col items-center justify-center gap-0.5 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          <SkipForward className="w-4 h-4" />
                          SKIP
                        </div>
                        <span className="text-[9px] text-gray-400">-3 pts</span>
                      </motion.button>
                    </>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleManualComplete}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors shadow-sm shadow-emerald-500/20"
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
                      className="text-xs text-gray-400 text-center mt-2 italic"
                    >
                      {skipMsg}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Progress dots */}
                <div className="mt-3 flex items-center gap-1.5 pl-5">
                  {activeTask.alarm.steps
                    .sort((a, b) => a.stepOrder - b.stepOrder)
                    .map((s) => (
                      <motion.div
                        key={s.id}
                        animate={{ scale: s.id === activeTask.step.id ? 1.1 : 1 }}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          s.isCompleted
                            ? 'bg-emerald-500 w-8'
                            : s.id === activeTask.step.id
                            ? 'bg-emerald-400 w-8'
                            : 'bg-emerald-200 w-4'
                        }`}
                      />
                    ))}
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
            {/* Main empty state */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center"
              >
                <Zap className="w-7 h-7 text-emerald-600" />
              </motion.div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">What should I do now?</h2>
              <p className="text-sm text-gray-500 mb-4">
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

            {/* Waiting Mode suggestion */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setCurrentView('waiting')}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-left shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  Got free time right now?
                </p>
                <p className="text-xs text-gray-500">
                  Turn dead time into done time
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FEELING STUCK HELP SECTION */}
      {!timerActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mx-4 mt-3"
        >
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Feeling stuck?</p>
              <p className="text-xs text-amber-700/70">Get a micro-action prompt</p>
            </div>
            <button
              onClick={() => {
                triggerStuckTask();
                haptic('medium');
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Help me
            </button>
          </div>
        </motion.div>
      )}

      {/* DELAY RESCUE */}
      <AnimatePresence>
        {showDelayRescue && activeTask && !timerActive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-4 mt-3"
          >
            <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Timer className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  Still stuck?
                </p>
                <p className="text-xs text-gray-500">
                  Try 30 sec version of &ldquo;{activeTask.step.label}&rdquo;
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleStart}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg h-8"
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

      {/* WAITING MODE BANNER */}
      {hasWaitingTasks && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-4 mt-3"
        >
          <button
            onClick={() => setCurrentView('waiting')}
            className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {waitingMsg}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {waitingSession!.tasks.filter((t) => !t.isCompleted).length} quick tasks until{' '}
                {waitingSession!.eventTitle}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        </motion.div>
      )}

      {/* Content area */}
      <div className="p-4">
        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-2 mx-0 mb-4">
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <Trophy className="w-4 h-4 text-emerald-500" />
            <p className="text-lg font-bold text-gray-900 mt-1">{todayCompletedSteps} Steps</p>
            <p className="text-[10px] text-gray-500">Today</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <Flame className="w-4 h-4 text-orange-500" />
            <p className="text-lg font-bold text-gray-900 mt-1">{streak} Day streak</p>
            <p className="text-[10px] text-gray-500">Keep going!</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <Zap className="w-4 h-4 text-emerald-500" />
            <p className="text-lg font-bold text-gray-900 mt-1">{score} Points</p>
            <p className="text-[10px] text-gray-500">Total score</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <p className="text-lg font-bold text-gray-900 mt-1">{completionRate}%</p>
            <p className="text-[10px] text-gray-500">Completion rate</p>
          </div>
        </div>

        {/* TODAY'S PROGRESS */}
        {(completedCount > 0 || todayCompletedSteps > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
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
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
              {todayCompletedSteps >= 3 ? (
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {completedCount} of {totalCount} steps done
                  </p>
                  {todayCompletedSteps >= 3 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-xs font-bold text-orange-600"
                    >
                      {todayCompletedSteps} today!
                    </motion.span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex-1 h-2 bg-emerald-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-bold text-emerald-700 tabular-nums">
                    {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                  </span>
                </div>
                {todaySkippedSteps > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] text-gray-500 mt-1 flex items-center gap-1"
                  >
                    <SkipForward className="w-3 h-3" />
                    {todaySkippedSteps} skipped today (-{todaySkippedSteps * 3} pts)
                  </motion.p>
                )}
              </div>
            </div>

            {/* Completed steps checklist */}
            {completedStepsList.length > 0 && (
              <div className="mt-2 space-y-1">
                {completedStepsList.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 px-1 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-gray-600 line-through">{step.label}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* COMING UP */}
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
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-emerald-700">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.step.label}</p>
                    <p className="text-[10px] text-gray-500">{item.alarm.title}</p>
                  </div>
                  <span className={`text-xs font-medium tabular-nums flex-shrink-0 ${
                    item.timeLabel === 'Overdue' ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {item.timeLabel}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Auto Flow Toggle */}
        <div className="mt-5">
          <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Auto Flow</p>
                <p className="text-xs text-gray-500">Auto-start next step timer</p>
              </div>
            </div>
            <button
              onClick={() => setAutoFlowEnabled(!autoFlowEnabled)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                autoFlowEnabled ? 'bg-emerald-500' : 'bg-gray-300'
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
