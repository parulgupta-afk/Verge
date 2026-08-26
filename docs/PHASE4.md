# Phase 4 — Voice depth (complete package)

**Goal:** Spoken guidance during navigation and reroutes, with mute control.

---

## What Phase 4 includes

### 1. Voice module
- File: `client/src/lib/voice.ts`
- `speak()` / `stopSpeaking()` / mute flag in `localStorage`
- Prefers `en-IN` voice when available

### 2. OSRM turn steps
- File: `client/src/lib/routing.ts`
- `fetchRoute(..., steps=true)` → `RouteResult.steps[]`
- Human-readable instructions from maneuver type + road name

### 3. Navigation screen speech
- File: `client/src/components/ActiveNavigationScreen.tsx`
- Speaks each maneuver when step index changes
- Speaks reroute message when present
- **Mute** button persists and cancels speech

### 4. App wiring
- Passes `activeRoute.steps` into navigation screen
- Calls `initVoices()` on mount (Chrome loads voices async)

---

## Demo checklist

1. `npm run dev` → map → Search a place (e.g. AIIMS)
2. Route appears → **Start navigation**
3. You should **hear** the first instruction (unmute browser tab if needed)
4. Mute icon → silence; unmute → speech resumes on next step
5. If route crosses a blocked segment → spoken reroute line

**Note:** Browsers may block speech until a user gesture (click/tap). Starting navigation after Search counts as a gesture.

---

## Limitations (Web Speech API)

- Quality varies by OS/browser
- iOS often requires a user gesture per utterance batch
- Offline uses local system voices only
- Not as consistent as cloud TTS (ElevenLabs / Google / Azure)

Cloud TTS can be a Phase 4+ optional upgrade.

---

## Git tag

`phase-4-complete`
