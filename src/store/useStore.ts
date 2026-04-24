import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Types ---
export interface AlarmStep {
  id: string;
  label: string;
  stepOrder: number;
  scheduledTime: string;
  isCompleted: boolean;
}

export interface SmartAlarm {
  id: string;
  title: string;
  finalTime: string;
  isActive: boolean;
  createdAt: string;
  steps: AlarmStep[];
}

export interface WaitingTask {
  id: string;
  label: string;
  isCompleted: boolean;
  taskOrder: number;
}

export interface WaitingSession {
  id: string;
  eventTitle: string;
  eventTime: string;
  isActive: boolean;
  createdAt: string;
  tasks: WaitingTask[];
}

export type ViewType = 'now' | 'alarms' | 'waiting';
export type EnergyMode = 'low' | 'normal' | 'high';

interface AppState {
  // Navigation
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;

  // Energy Mode
  energyMode: EnergyMode;
  setEnergyMode: (mode: EnergyMode) => void;

  // Alarms
  alarms: SmartAlarm[];
  addAlarm: (alarm: SmartAlarm) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  completeStep: (alarmId: string, stepId: string) => void;
  uncompleteStep: (alarmId: string, stepId: string) => void;
  skipStep: (alarmId: string, stepId: string) => void;

  // Auto Flow
  autoFlowEnabled: boolean;
  setAutoFlowEnabled: (enabled: boolean) => void;

  // Waiting
  waitingSession: WaitingSession | null;
  startWaiting: (session: WaitingSession) => void;
  completeWaitingTask: (taskId: string) => void;
  endWaiting: () => void;

  // UI
  showCreateAlarm: boolean;
  setShowCreateAlarm: (show: boolean) => void;
  showShareSheet: boolean;
  setShowShareSheet: (show: boolean) => void;

  // I'm Stuck
  stuckTask: { label: string; emoji: string } | null;
  showStuckModal: boolean;
  triggerStuckTask: () => void;
  dismissStuckModal: () => void;

  // Feedback / celebration
  lastCompletedLabel: string | null;
  setLastCompletedLabel: (label: string | null) => void;
  showCelebration: boolean;
  setShowCelebration: (show: boolean) => void;

  // Streak + Skip penalty
  todayCompletedSteps: number;
  todaySkippedSteps: number;
  lastCompletionDate: string | null;
  getTotalScore: () => number;

  // Computed helpers
  getActiveTask: () => { alarm: SmartAlarm; step: AlarmStep } | null;
  getNextTask: () => { alarm: SmartAlarm; step: AlarmStep } | null;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentView: 'now',
      setCurrentView: (view) => set({ currentView: view }),

      // Energy Mode
      energyMode: 'normal',
      setEnergyMode: (mode) => set({ energyMode: mode }),

      // Alarms
      alarms: [],
      addAlarm: (alarm) =>
        set((state) => ({ alarms: [alarm, ...state.alarms] })),
      deleteAlarm: (id) =>
        set((state) => ({ alarms: state.alarms.filter((a) => a.id !== id) })),
      toggleAlarm: (id) =>
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === id ? { ...a, isActive: !a.isActive } : a
          ),
        })),
      completeStep: (alarmId, stepId) => {
        const state = get();
        const alarm = state.alarms.find((a) => a.id === alarmId);
        const step = alarm?.steps.find((s) => s.id === stepId);

        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === alarmId
              ? {
                  ...a,
                  steps: a.steps.map((s) =>
                    s.id === stepId ? { ...s, isCompleted: true } : s
                  ),
                }
              : a
          ),
          lastCompletedLabel: step?.label ?? null,
          showCelebration: true,
        }));

        setTimeout(() => set({ showCelebration: false }), 2500);

        const today = getTodayString();
        if (state.lastCompletionDate !== today) {
          set({ todayCompletedSteps: 1, lastCompletionDate: today, todaySkippedSteps: 0 });
        } else {
          set({ todayCompletedSteps: state.todayCompletedSteps + 1 });
        }
      },
      uncompleteStep: (alarmId, stepId) =>
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === alarmId
              ? {
                  ...a,
                  steps: a.steps.map((s) =>
                    s.id === stepId ? { ...s, isCompleted: false } : s
                  ),
                }
              : a
          ),
        })),
      skipStep: (alarmId, stepId) => {
        // Skip = complete but counts as penalty
        const state = get();
        const alarm = state.alarms.find((a) => a.id === alarmId);

        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === alarmId
              ? {
                  ...a,
                  steps: a.steps.map((s) =>
                    s.id === stepId ? { ...s, isCompleted: true } : s
                  ),
                }
              : a
          ),
          lastCompletedLabel: alarm?.steps.find((s) => s.id === stepId)?.label ?? null,
          showCelebration: false, // No celebration for skip
        }));

        const today = getTodayString();
        if (state.lastCompletionDate !== today) {
          set({ todayCompletedSteps: 0, todaySkippedSteps: 1, lastCompletionDate: today });
        } else {
          set({ todaySkippedSteps: state.todaySkippedSteps + 1 });
        }
      },

      // Auto Flow
      autoFlowEnabled: false,
      setAutoFlowEnabled: (enabled) => set({ autoFlowEnabled: enabled }),

      // Waiting
      waitingSession: null,
      startWaiting: (session) => set({ waitingSession: session }),
      completeWaitingTask: (taskId) =>
        set((state) => {
          if (!state.waitingSession) return state;
          return {
            waitingSession: {
              ...state.waitingSession,
              tasks: state.waitingSession.tasks.map((t) =>
                t.id === taskId ? { ...t, isCompleted: true } : t
              ),
            },
            showCelebration: true,
          };
        }),
      endWaiting: () => set({ waitingSession: null }),

      // UI
      showCreateAlarm: false,
      setShowCreateAlarm: (show) => set({ showCreateAlarm: show }),
      showShareSheet: false,
      setShowShareSheet: (show) => set({ showShareSheet: show }),

      // I'm Stuck
      stuckTask: null,
      showStuckModal: false,
      triggerStuckTask: () => {
        const { energyMode } = get();
        let tasks: { label: string; emoji: string }[];
        if (energyMode === 'low') {
          tasks = [
            { label: 'Take 5 deep breaths', emoji: '🌬️' },
            { label: 'Drink one glass of water', emoji: '💧' },
            { label: 'Stand up and stretch', emoji: '💪' },
          ];
        } else if (energyMode === 'high') {
          tasks = [
            { label: 'Do 10 jumping jacks', emoji: '🏃' },
            { label: 'Write your next 3 tasks', emoji: '📝' },
            { label: 'Reply to one pending message', emoji: '💬' },
          ];
        } else {
          tasks = [
            { label: 'Walk to another room and back', emoji: '🚶' },
            { label: 'Put away 3 things', emoji: '📦' },
            { label: 'Quick face wash', emoji: '🫧' },
          ];
        }
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        set({ stuckTask: randomTask, showStuckModal: true });
      },
      dismissStuckModal: () => set({ showStuckModal: false }),

      // Feedback
      lastCompletedLabel: null,
      setLastCompletedLabel: (label) => set({ lastCompletedLabel: label }),
      showCelebration: false,
      setShowCelebration: (show) => set({ showCelebration: show }),

      // Streak + Score
      todayCompletedSteps: 0,
      todaySkippedSteps: 0,
      lastCompletionDate: null,
      getTotalScore: () => {
        const { todayCompletedSteps, todaySkippedSteps } = get();
        return todayCompletedSteps * 10 - todaySkippedSteps * 3;
      },

      // Computed helpers
      getActiveTask: () => {
        const { alarms } = get();
        const now = new Date();

        for (const alarm of alarms) {
          if (!alarm.isActive) continue;
          const sortedSteps = [...alarm.steps].sort(
            (a, b) => a.stepOrder - b.stepOrder
          );
          for (const step of sortedSteps) {
            if (!step.isCompleted) {
              const stepTime = new Date(step.scheduledTime);
              const diff = stepTime.getTime() - now.getTime();
              if (diff <= 30 * 60 * 1000 && diff >= -10 * 60 * 1000) {
                return { alarm, step };
              }
            }
          }
          for (const step of sortedSteps) {
            if (!step.isCompleted) {
              return { alarm, step };
            }
          }
        }
        return null;
      },
      getNextTask: () => {
        const { alarms } = get();
        const activeTask = get().getActiveTask();

        for (const alarm of alarms) {
          if (!alarm.isActive) continue;
          const sortedSteps = [...alarm.steps].sort(
            (a, b) => a.stepOrder - b.stepOrder
          );
          let foundActive = false;
          for (const step of sortedSteps) {
            if (activeTask && step.id === activeTask.step.id) {
              foundActive = true;
              continue;
            }
            if (foundActive && !step.isCompleted) {
              return { alarm, step };
            }
            if (!activeTask && !step.isCompleted) {
              const allIncomplete = sortedSteps.filter((s) => !s.isCompleted);
              if (allIncomplete.length > 1) {
                return { alarm, step: allIncomplete[1] };
              }
            }
          }
        }
        return null;
      },
    }),
    {
      name: 'transition-coach-storage',
    }
  )
);

// Helper to create a new alarm with steps
export function createAlarmData(
  title: string,
  finalTime: string,
  steps: { label: string; minutesBefore: number }[]
): SmartAlarm {
  const finalDate = new Date(finalTime);
  const alarmId = generateId();

  const alarmSteps: AlarmStep[] = steps
    .sort((a, b) => b.minutesBefore - a.minutesBefore)
    .map((s, i) => ({
      id: generateId(),
      label: s.label,
      stepOrder: i + 1,
      scheduledTime: new Date(
        finalDate.getTime() - s.minutesBefore * 60 * 1000
      ).toISOString(),
      isCompleted: false,
    }));

  return {
    id: alarmId,
    title,
    finalTime: finalDate.toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
    steps: alarmSteps,
  };
}
