// Anonymous visitor tracking — no signup/login needed
// Generates a unique ID per browser, saves in localStorage, sends to API

const STORAGE_KEY = 'tc-anon-id';

function generateAnonymousId(): string {
  // Create a unique ID from random string + timestamp
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${id}-${Date.now().toString(36)}`;
}

function getOrCreateAnonymousId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateAnonymousId();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function trackVisit(): void {
  if (typeof window === 'undefined') return;

  const anonymousId = getOrCreateAnonymousId();
  if (!anonymousId) return;

  // Fire and forget — don't block the app
  fetch('/api/visitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anonymousId }),
  }).catch(() => {
    // Silent fail — tracking should never break the app
  });
}

export function getAnonymousId(): string {
  return getOrCreateAnonymousId();
}
