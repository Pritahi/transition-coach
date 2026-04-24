// Motivational micro-copy system — shame-free, ADHD-friendly

export const completions = [
  'Nice! You\'re moving.',
  'Done. Keep going.',
  'That\'s one down. You\'re already moving.',
  'Clean step. Next one.',
  'You showed up. That counts.',
  'Small win. Big momentum.',
  'No overthinking — just action.',
  'One less thing to worry about.',
  'Building momentum, step by step.',
  'Your brain just rewarded you. Feels good?',
  'That was easy, right?',
  'Progress, not perfection.',
  'You\'re doing it. Seriously.',
  'Zero friction. Pure action.',
  'The hardest part is starting — you just did it.',
  'Another one bites the dust.',
  'Flow state loading...',
  'You\'re on fire right now.',
  'See? Not so hard.',
  'This is what momentum feels like.',
];

export const encouragements = [
  'Let\'s go. Just one step.',
  'You got this. Start small.',
  'No pressure. Just begin.',
  'One thing at a time. That\'s it.',
  'Ready when you are.',
  'Your future self will thank you.',
  'Tiny action, huge shift.',
  'Don\'t think. Just start.',
  'The plan is ready. Execute.',
  'Trust the process. Start now.',
  'What\'s the smallest version of this you can do?',
  '2 minutes. That\'s all we\'re asking.',
  'Your brain wants to overthink. Don\'t let it.',
  'Action > perfection. Always.',
  'You\'ve done harder things than this.',
];

export const shameFreeResets = [
  'Paused. Let\'s restart — no judgment.',
  'Took a break? Good. Let\'s go again.',
  'You\'re here. That\'s what matters.',
  'Reset? Easy. Start from where you left off.',
  'Not starting yet? That\'s okay. Try now.',
  'Hey, you opened the app. That\'s step 1.',
  'The timer didn\'t judge you. Neither do we.',
  'Let\'s try again. Fresh start, right now.',
  'ADHD brains restart a lot. That\'s normal.',
  'You didn\'t fail — you just haven\'t started yet.',
];

export const waitingEncouragements = [
  '20 min to kill? Let\'s make them count.',
  'Dead time → done time.',
  'Small tasks, big wins.',
  'These micro-moves add up.',
  'You\'re not waiting — you\'re preparing.',
  'Fill the gap. Feel the difference.',
  'While others scroll, you move.',
  'Make this time work for you.',
  'This is your secret superpower.',
  'Nobody else does this. That\'s why it works.',
  'Productivity doesn\'t need a desk.',
  'Every completed task is a dopamine hit.',
];

export const skipMessages = [
  'Skipped. No big deal — let\'s keep going.',
  'Okay, skipped. Next one.',
  'That\'s okay. We all skip sometimes.',
  'Noted. Moving on — no judgment.',
  'Skipped. The important thing is you\'re here.',
  'No worries. Try the next one.',
];

export const timePressureMessages = [
  'Time is ticking — start now!',
  'Only a few minutes left. You got this.',
  'Don\'t let this one slip. Go!',
  'The clock is running. Start!',
  'Every second counts right now.',
  'This window is closing. Start!',
  'Quick — before time runs out!',
  'Chop chop! Clock\'s ticking.',
];

export const energyMessages = {
  low: {
    label: 'Low Energy',
    emoji: '🔋',
    description: 'Simple, gentle tasks',
    hint: 'We picked easy tasks for your energy level',
    tasks: ['Breathe for 30 seconds', 'Sit comfortably', 'Close your eyes for 1 min'],
  },
  normal: {
    label: 'Normal',
    emoji: '⚡',
    description: 'Standard flow',
    hint: 'Balanced tasks — not too easy, not too hard',
    tasks: ['Quick stretch', 'Get water', 'Check one thing off'],
  },
  high: {
    label: 'High Energy',
    emoji: '🔥',
    description: 'Full speed ahead',
    hint: 'Power tasks for your high energy!',
    tasks: ['Power through', 'Do 2 things at once', 'Crush the next 3 steps'],
  },
};

// Stuck tasks pool — organized by energy
export const stuckTasksByEnergy = {
  low: [
    { label: 'Take 5 deep breaths right now', emoji: '🌬️' },
    { label: 'Drink one glass of water', emoji: '💧' },
    { label: 'Stand up and stretch for 30 sec', emoji: '💪' },
    { label: 'Close your eyes and count to 10', emoji: '😴' },
    { label: 'Put your phone face down for 1 min', emoji: '📵' },
  ],
  normal: [
    { label: 'Walk to another room and back', emoji: '🚶' },
    { label: 'Put away 3 things near you', emoji: '📦' },
    { label: 'Quick face wash with cold water', emoji: '🫧' },
    { label: 'Write down one thing you\'re grateful for', emoji: '✏️' },
    { label: 'Open a window and take 3 breaths', emoji: '🪟' },
    { label: 'Tidy your desk for 2 minutes', emoji: '🧹' },
  ],
  high: [
    { label: 'Do 10 jumping jacks right now', emoji: '🏃' },
    { label: 'Write your next 3 tasks on paper', emoji: '📝' },
    { label: 'Reply to one pending message', emoji: '💬' },
    { label: 'Do 5 push-ups against the wall', emoji: '💪' },
    { label: 'Organize one messy spot in your room', emoji: '✨' },
    { label: 'Text someone "thinking of you"', emoji: '❤️' },
  ],
};

// --- Utility Functions ---

export function getRandomCompletion(): string {
  return completions[Math.floor(Math.random() * completions.length)];
}

export function getRandomEncouragement(): string {
  return encouragements[Math.floor(Math.random() * encouragements.length)];
}

export function getRandomReset(): string {
  return shameFreeResets[Math.floor(Math.random() * shameFreeResets.length)];
}

export function getRandomWaitingMsg(): string {
  return waitingEncouragements[Math.floor(Math.random() * waitingEncouragements.length)];
}

export function getRandomSkipMsg(): string {
  return skipMessages[Math.floor(Math.random() * skipMessages.length)];
}

export function getRandomPressureMsg(): string {
  return timePressureMessages[Math.floor(Math.random() * timePressureMessages.length)];
}

export function getRandomStuckTask(energy: 'low' | 'normal' | 'high'): { label: string; emoji: string } {
  const tasks = stuckTasksByEnergy[energy];
  return tasks[Math.floor(Math.random() * tasks.length)];
}

// Estimated duration for a step label (used for countdown)
export function estimateStepDuration(label: string): number {
  const lower = label.toLowerCase();
  if (lower.includes('stretch') || lower.includes('walk') || lower.includes('breathe')) return 2;
  if (lower.includes('brush') || lower.includes('wash') || lower.includes('face')) return 3;
  if (lower.includes('dress') || lower.includes('shoes') || lower.includes('clothes')) return 3;
  if (lower.includes('pack') || lower.includes('bag')) return 5;
  if (lower.includes('cook') || lower.includes('food') || lower.includes('eat')) return 10;
  if (lower.includes('laptop') || lower.includes('open') || lower.includes('join')) return 2;
  if (lower.includes('shower') || lower.includes('bath')) return 10;
  if (lower.includes('sleep') || lower.includes('bed')) return 2;
  if (lower.includes('warm up') || lower.includes('warmup')) return 5;
  if (lower.includes('water')) return 1;
  if (lower.includes('phone') || lower.includes('charger')) return 1;
  return 3; // default 3 min
}

// --- Sound Effects (Web Audio API — no external files) ---

export function playCompletionSound() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio not supported — silent fallback
  }
}

export function playStartSound() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.25);
  } catch {
    // silent
  }
}

export function playSkipSound() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(350, ctx.currentTime); // Lower tone
    oscillator.frequency.setValueAtTime(280, ctx.currentTime + 0.1); // Drop

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } catch {
    // silent
  }
}

// --- Haptic Feedback ---

export function haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate([30, 10, 30]);
        break;
    }
  } catch {
    // Vibration not supported
  }
}
