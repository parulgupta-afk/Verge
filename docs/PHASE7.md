# Phase 7 — Social & personalization (complete package)

**Goal:** Learn frequent destinations and share routes with others.

---

## What Phase 7 includes

### 1. Commute learning
- Every successful destination search is remembered
- Sorted by use count (`lib/commute.ts`)
- Stored in `localStorage` (up to 20 places)

### 2. Social panel
- **Social** button on the map
- List of frequent destinations → one-tap navigate
- Remove individual entries

### 3. Share / join
- **Share current destination** copies a text + encoded code to the clipboard
- **Join** pastes the code → decodes place → calculates route
- No server required for MVP share (code is self-contained)

---

## Demo checklist

1. Search AIIMS, Bellandur, etc. a few times  
2. Open **Social** → see them listed with use counts  
3. Set a route → **Share current destination** → copy  
4. Paste code in Join on another browser/session → route opens  

---

## Not yet

- Live convoy GPS sharing  
- Account-synced commutes (needs Auth)  
- Deep links `https://…/go?code=`

---

## Git tag

`phase-7-complete`
