/**
 * Verge Phase 4 — Web Speech voice layer
 * Mute-aware, en-IN preferred, safe cancel/restart
 */

const MUTE_KEY = 'verge_voice_muted';

export function isVoiceMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MUTE_KEY) === '1';
}

export function setVoiceMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  if (muted) stopSpeaking();
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

export function speak(text: string, opts?: { force?: boolean; lang?: string }): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  if (!opts?.force && isVoiceMuted()) return;
  if (!text?.trim()) return;

  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.trim());
    u.rate = 1.05;
    u.lang = opts?.lang || 'en-IN';
    // Prefer an Indian English voice when available
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => /en-IN/i.test(v.lang)) ||
      voices.find((v) => /en-GB/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang));
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

/** Warm up voices (Chrome loads them async) */
export function initVoices(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
