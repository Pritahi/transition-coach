// Quick templates for common ADHD alarm flows
export interface AlarmTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  steps: { label: string; minutesBefore: number }[];
}

export const alarmTemplates: AlarmTemplate[] = [
  {
    id: 'morning',
    name: 'Morning Routine',
    emoji: '🌅',
    description: 'Get ready for the day',
    steps: [
      { label: 'Wake up & stretch', minutesBefore: 30 },
      { label: 'Brush teeth', minutesBefore: 20 },
      { label: 'Get dressed', minutesBefore: 10 },
    ],
  },
  {
    id: 'leave-home',
    name: 'Leave Home',
    emoji: '🚶',
    description: 'Ready to go out',
    steps: [
      { label: 'Pack bag', minutesBefore: 20 },
      { label: 'Wear shoes', minutesBefore: 10 },
      { label: 'Leave the house', minutesBefore: 0 },
    ],
  },
  {
    id: 'online-class',
    name: 'Online Class',
    emoji: '💻',
    description: 'Join your class on time',
    steps: [
      { label: 'Open laptop', minutesBefore: 15 },
      { label: 'Get water', minutesBefore: 5 },
      { label: 'Join the meeting', minutesBefore: 0 },
    ],
  },
  {
    id: 'workout',
    name: 'Workout',
    emoji: '💪',
    description: 'Start your exercise',
    steps: [
      { label: 'Change clothes', minutesBefore: 15 },
      { label: 'Warm up', minutesBefore: 5 },
      { label: 'Start workout', minutesBefore: 0 },
    ],
  },
  {
    id: 'sleep',
    name: 'Bedtime',
    emoji: '😴',
    description: 'Wind down for sleep',
    steps: [
      { label: 'Put phone on charger', minutesBefore: 30 },
      { label: 'Brush teeth & wash face', minutesBefore: 15 },
      { label: 'Get in bed', minutesBefore: 0 },
    ],
  },
  {
    id: 'cooking',
    name: 'Start Cooking',
    emoji: '🍳',
    description: 'Prepare your meal',
    steps: [
      { label: 'Decide what to eat', minutesBefore: 20 },
      { label: 'Get ingredients', minutesBefore: 10 },
      { label: 'Start cooking', minutesBefore: 0 },
    ],
  },
];

// Micro-task suggestions for waiting mode — organized by energy level
export interface MicroTaskSuggestion {
  label: string;
  emoji: string;
  energy: 'low' | 'normal' | 'high';
}

export const microTaskBank: MicroTaskSuggestion[] = [
  // LOW energy tasks
  { label: 'Take 5 deep breaths', emoji: '🌬️', energy: 'low' },
  { label: 'Fill water bottle', emoji: '💧', energy: 'low' },
  { label: 'Close your eyes for 1 min', emoji: '😴', energy: 'low' },
  { label: 'Sit up straight', emoji: '🧘', energy: 'low' },
  { label: 'Drink one glass of water', emoji: '💧', energy: 'low' },
  { label: 'Put phone face down', emoji: '📵', energy: 'low' },
  { label: 'Look out the window for 30 sec', emoji: '🪟', energy: 'low' },
  // NORMAL energy tasks
  { label: '2 minute walk', emoji: '🚶', energy: 'normal' },
  { label: 'Stretch your arms and back', emoji: '💪', energy: 'normal' },
  { label: 'Pack your bag', emoji: '🎒', energy: 'normal' },
  { label: 'Clean your desk', emoji: '🧹', energy: 'normal' },
  { label: 'Quick face wash', emoji: '🫧', energy: 'normal' },
  { label: 'Put things in their place', emoji: '📦', energy: 'normal' },
  { label: 'Reply to 1 message', emoji: '💬', energy: 'normal' },
  { label: 'Organize one drawer', emoji: '🗄️', energy: 'normal' },
  { label: 'Water a plant', emoji: '🌱', energy: 'normal' },
  { label: 'Clear your phone notifications', emoji: '🔔', energy: 'normal' },
  // HIGH energy tasks
  { label: 'Do 10 jumping jacks', emoji: '🏃', energy: 'high' },
  { label: 'Revise notes for 2 min', emoji: '📖', energy: 'high' },
  { label: 'Clean 5 items from your room', emoji: '✨', energy: 'high' },
  { label: 'Write down your next 3 tasks', emoji: '📝', energy: 'high' },
  { label: 'Stand up and stretch for 2 min', emoji: '🤸', energy: 'high' },
  { label: 'Do 5 wall push-ups', emoji: '💪', energy: 'high' },
  { label: 'Plan tomorrow in 2 minutes', emoji: '📋', energy: 'high' },
];

export type EnergyLevel = 'low' | 'normal' | 'high';

export function getMicroTasksForEnergy(
  energy: EnergyLevel,
  count: number = 3
): MicroTaskSuggestion[] {
  // Get tasks at or below the energy level
  const energyOrder: EnergyLevel[] = ['low', 'normal', 'high'];
  const maxIndex = energyOrder.indexOf(energy);
  const eligible = microTaskBank.filter((t) =>
    energyOrder.indexOf(t.energy) <= maxIndex
  );
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getRandomMicroTasks(count: number = 3): MicroTaskSuggestion[] {
  const shuffled = [...microTaskBank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Generate a shareable text for a template
export function generateShareText(template: AlarmTemplate): string {
  const stepsText = template.steps
    .map((s, i) => `${i + 1}. ${s.label}`)
    .join('\n');
  return `⚡ My Transition Coach Flow:\n\n${template.emoji} ${template.name}\n${stepsText}\n\n🎯 "Stop overthinking. Start next step."\n👉 Try Transition Coach — the ADHD day-unfreezing tool`;
}

// Generate personal progress share text
export function generateProgressShareText(
  completedSteps: number,
  totalSteps: number,
  score: number,
  skippedSteps: number
): string {
  const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  return `⚡ Transition Coach Progress:\n\n✅ ${completedSteps}/${totalSteps} steps completed\n🏆 ${score} points today${skippedSteps > 0 ? `\n⏭️ ${skippedSteps} skipped` : ''}\n📊 ${percentage}% done\n\n🎯 "Stop overthinking. Start next step."`;
}
