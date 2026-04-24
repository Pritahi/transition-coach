---
Task ID: 1
Agent: Main
Task: Simplify UX — ADHD-first redesign based on user feedback

Work Log:
- Read and analyzed all component files (app.tsx, now-screen.tsx, alarms-list.tsx, stuck-modal.tsx, waiting-mode.tsx, create-alarm-sheet.tsx, store/useStore.ts, lib/motivation.ts, lib/templates.ts)
- Updated store/useStore.ts: Added `hasOnboarded` state, upgraded `triggerStuckTask` from 1 random task to 3 difficulty-based options (easy/medium/tiny) with energy-aware task pools
- Created new `onboarding-screen.tsx`: 2-step onboarding flow with "Can't decide what to do next?" → "Let's fix your next 30 minutes" → auto-creates alarm with 3 steps, celebration on complete
- Rewrote `stuck-modal.tsx`: Shows 3 task cards (Easy/Medium/Tiny) with color-coded difficulty, descriptions, and one-tap completion
- Rewrote `alarms-list.tsx`: Hero card for next upcoming alarm with countdown + Start Now, "Other Alarms" compact section, "Later Today" section for remaining active alarms, simplified step management
- Updated `now-screen.tsx`: Simplified empty state ("What should I do now?" + single CTA), added Waiting Mode suggestion card ("Got free time right now?") when idle
- Updated `app.tsx`: Added OnboardingScreen overlay (full-screen, first visit only), simplified header (smaller, removed subtitle, removed live pulse dot), added onboarding import
- Build: ✅ Compiled successfully, 0 errors
- Pushed to GitHub: commit 80b1c2b

Stage Summary:
- Onboarding: 2-step flow → auto alarm creation → auto redirect to NOW
- Stuck Modal: 1 task → 3 difficulty options (Easy/Medium/Tiny) with energy awareness
- Alarms Page: Hero card for next alarm, compact list for others, less clutter
- NOW Screen: Waiting Mode suggestion when idle, simplified empty state
- Header: Smaller, cleaner
- All changes pushed to https://github.com/Pritahi/transition-coach (branch: main)
