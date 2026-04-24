'use client';

import { ThemeProvider } from 'next-themes';
import TransitionCoach from '@/components/transition-coach/app';

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TransitionCoach />
    </ThemeProvider>
  );
}
