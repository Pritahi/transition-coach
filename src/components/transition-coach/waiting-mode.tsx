'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  Circle,
  Timer,
  Play,
  X,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Zap,
  Share2,
  Battery,
  Flame,
} from 'lucide-react';
import { useStore, type EnergyMode } from '@/store/useStore';
import { getMicroTasksForEnergy, generateProgressShareText } from '@/lib/templates';
import { getRandomWaitingMsg, playCompletionSound, playStartSound, haptic, energyMessages } from '@/lib/motivation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function formatTimeUntil(isoString: string): string {
  const now = new Date();
  const target = new Date(isoString);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'Started!';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function formatTimeUntilPrecise(isoString: string): string {
  const now = new Date();
  const target = new Date(isoString);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return '0:00';
  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getTimeAvailableMinutes(isoString: string): number {
  const now = new Date();
  const target = new Date(isoString);
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / (1000 * 60)));
}

export default function WaitingMode() {
  const { waitingSession, startWaiting, completeWaitingTask, endWaiting, energyMode, setShowShareSheet, todayCompletedSteps, todaySkippedSteps, getTotalScore } = useStore();
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [error, setError] = useState('');
  const [previewTasks, setPreviewTasks] = useState<
    { label: string; emoji: string }[]
  >([]);
  const [showPreview, setShowPreview] = useState(false);
  const initialMsg = useMemo(() => getRandomWaitingMsg(), []);
  const [tick, setTick] = useState(0);

  const handleEventTimeChange = (value: string) => {
    setEventTime(value);
    setError('');
    if (value) {
      setPreviewTasks(getMicroTasksForEnergy(energyMode, 3));
      setShowPreview(true);
    } else {
      setShowPreview(false);
    }
  };

  // Live tick for countdown display
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const derivedEnergyTasks = previewTasks;

  const handleStartWaiting = () => {
    if (!eventTitle.trim()) {
      setError('What are you waiting for? Just one line.');
      return;
    }
    if (!eventTime) {
      setError('When is the event?');
      return;
    }

    const tasks = derivedEnergyTasks.length > 0 ? derivedEnergyTasks : getMicroTasksForEnergy(energyMode, 3);
    const session = {
      id: generateId(),
      eventTitle: eventTitle.trim(),
      eventTime: new Date(eventTime).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
      tasks: tasks.map((t, i) => ({
        id: generateId(),
        label: `${t.emoji} ${t.label}`,
        isCompleted: false,
        taskOrder: i + 1,
      })),
    };

    startWaiting(session);
    setEventTitle('');
    setEventTime('');
    setError('');
    setPreviewTasks([]);
    setShowPreview(false);
    playStartSound();
    haptic('medium');
  };

  const handleShuffle = () => {
    if (!waitingSession) return;
    const newTasks = getMicroTasksForEnergy(energyMode, 3);
    const updatedSession = {
      ...waitingSession,
      tasks: newTasks.map((t, i) => ({
        id: generateId(),
        label: `${t.emoji} ${t.label}`,
        isCompleted: false,
        taskOrder: i + 1,
      })),
    };
    startWaiting(updatedSession);
    haptic('light');
  };

  const handleTaskComplete = (taskId: string) => {
    completeWaitingTask(taskId);
    playCompletionSound();
    haptic('heavy');
  };

  const completedCount = waitingSession?.tasks.filter((t) => t.isCompleted).length ?? 0;
  const totalCount = waitingSession?.tasks.length ?? 0;
  const allDone = completedCount === totalCount && totalCount > 0;
  const timeAvailable = eventTime ? getTimeAvailableMinutes(eventTime) : 0;

  const energyLabels: Record<EnergyMode, string> = {
    low: 'Easy tasks for low energy',
    normal: 'Standard quick tasks',
    high: 'Productive power tasks',
  };

  const energyIcons: Record<EnergyMode, typeof Battery> = {
    low: Battery,
    normal: Zap,
    high: Flame,
  };

  return (
    <div className="flex flex-col">
      <div className="p-4 pb-2">
        <h2 className="text-xl font-bold">Waiting Mode</h2>
        <p className="text-sm text-muted-foreground">
          Dead time → done time
        </p>
      </div>

      <div className="px-4 pb-4">
        <AnimatePresence mode="wait">
          {!waitingSession?.isActive ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center min-h-[60vh] -mt-4"
            >
              <div className="w-full max-w-sm space-y-5">
                {/* Visual — time-focused */}
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <Timer className="w-12 h-12 text-gray-600" />
                  </motion.div>
                  <h3 className="text-lg font-bold mb-1">
                    {timeAvailable > 0
                      ? `You have ${timeAvailable} min — want quick wins?`
                      : 'Got time before something?'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tell us what&apos;s next — we&apos;ll fill the gap with tasks
                  </p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="event-title" className="text-sm font-medium">
                      What are you waiting for?
                    </Label>
                    <Input
                      id="event-title"
                      placeholder="e.g., Doctor at 3PM, Class in 20 min"
                      value={eventTitle}
                      onChange={(e) => {
                        setEventTitle(e.target.value);
                        setError('');
                      }}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="event-time" className="text-sm font-medium">
                      When does it start?
                    </Label>
                    <Input
                      id="event-time"
                      type="datetime-local"
                      value={eventTime}
                      onChange={(e) => handleEventTimeChange(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-destructive"
                    >
                      {error}
                    </motion.p>
                  )}

                  {/* VALUE PREVIEW — instant suggestions */}
                  <AnimatePresence>
                    {showPreview && derivedEnergyTasks.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-bold text-gray-900">
                                {timeAvailable > 0
                                  ? `Here's what we'll do in ${timeAvailable} min:`
                                  : "Here's what we'll do:"}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {derivedEnergyTasks.map((task, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-3 p-2.5 rounded-lg bg-white"
                              >
                                <span className="text-lg">{task.emoji}</span>
                                <span className="text-sm font-medium text-gray-800 flex-1">
                                  {task.label}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-gray-600 border-gray-300"
                                >
                                  ~{i < 2 ? '2 min' : '1 min'}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                          {/* Energy indicator */}
                          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-200/50">
                            {(() => { const EIcon = energyIcons[energyMode]; return <EIcon className="w-3.5 h-3.5 text-gray-500" />; })()}
                            <span className="text-xs text-gray-500">
                              {energyMessages[energyMode].hint}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    onClick={handleStartWaiting}
                    disabled={!eventTitle.trim() || !eventTime}
                    className="w-full h-12 bg-gray-900 hover:bg-black text-white text-base font-semibold rounded-xl disabled:opacity-40"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Now
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ACTIVE SESSION */
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Event card with live countdown */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Waiting for
                    </p>
                    <h3 className="text-lg font-bold text-gray-900">
                      {waitingSession.eventTitle}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={endWaiting}
                    className="h-8 w-8 text-gray-500 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* LIVE countdown */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Clock className="w-4 h-4 text-gray-600" />
                    </motion.div>
                    <span className="text-sm font-bold text-gray-900 tabular-nums">
                      {formatTimeUntilPrecise(waitingSession.eventTime)}
                    </span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs text-gray-500">
                    {formatTimeUntil(waitingSession.eventTime)} left
                  </span>
                  {/* TIME PRESSURE */}
                  <Badge className="bg-gray-900 text-white border-0 text-[10px] font-bold ml-auto">
                    {completedCount === 0 ? 'Start now!' : `${totalCount - completedCount} left`}
                  </Badge>
                </div>

                {/* Motivational */}
                <motion.p
                  key={initialMsg}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-gray-500 mt-1.5 italic"
                >
                  {initialMsg}
                </motion.p>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3 px-1">
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gray-800 rounded-full"
                  />
                </div>
                <span className="text-sm font-bold text-muted-foreground tabular-nums">
                  {completedCount}/{totalCount}
                </span>
              </div>

              {/* All done celebration */}
              {allDone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="bg-white border border-gray-200 rounded-xl p-5 text-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                  >
                    <Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  </motion.div>
                  <p className="font-bold text-gray-900 text-lg">
                    All done! You just unblocked your time.
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    That&apos;s momentum. Ready for{' '}
                    <span className="font-semibold">{waitingSession.eventTitle}</span>?
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    You didn&apos;t waste this time. That&apos;s rare.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowShareSheet(true)}
                    className="mt-3"
                  >
                    <Share2 className="w-4 h-4 mr-1.5" />
                    Share Progress
                  </Button>
                </motion.div>
              )}

              {/* Micro Tasks */}
              <div className="space-y-3">
                {waitingSession.tasks.map((task, index) => (
                  <motion.button
                    key={task.id}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => {
                      if (!task.isCompleted) {
                        handleTaskComplete(task.id);
                      }
                    }}
                    disabled={task.isCompleted}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all relative overflow-hidden ${
                      task.isCompleted
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-card border-border hover:border-gray-300 hover:shadow-lg hover:shadow-black/5'
                    }`}
                  >
                    <div className="absolute top-2 right-3">
                      <span className="text-[10px] text-muted-foreground/50">
                        {index + 1}/{totalCount}
                      </span>
                    </div>

                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                        task.isCompleted
                          ? 'bg-gray-800 text-white scale-110'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {task.isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <CheckCircle2 className="w-7 h-7" />
                        </motion.div>
                      ) : (
                        <Circle className="w-7 h-7" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p
                        className={`text-base font-medium transition-all ${
                          task.isCompleted ? 'text-muted-foreground' : ''
                        }`}
                      >
                        {task.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.isCompleted ? 'Done!' : 'Tap to complete'}
                      </p>
                    </div>
                    {!task.isCompleted && (
                      <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Shuffle */}
              {!allDone && (
                <Button
                  variant="outline"
                  onClick={handleShuffle}
                  className="w-full rounded-xl"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Shuffle — give me different tasks
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={endWaiting}
                className="w-full text-muted-foreground"
              >
                End Waiting Mode — no judgment
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
