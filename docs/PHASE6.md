# Phase 6 — Civic / emergency / offline (complete package)

**Goal:** Civic context, emergency priority weighting, and last-known status when offline.

---

## What Phase 6 includes

### 1. Official / civic feed panel
- Demo notices for Delhi & Bangalore (`data/officialFeeds.ts`)
- **Civic** button on the map opens the panel
- Severity: info / warning / critical

### 2. Emergency priority mode
- Toggle inside the Civic panel
- When **on**, blocked/partial segments get higher effective confidence so risk-aware routing (Phase 5) avoids them more aggressively
- Badge shows `🚨 Emergency` when active

### 3. Offline snapshot
- `lib/offlineCache.ts` saves segments whenever they update
- On load, if `navigator.onLine === false`, restores last snapshot
- Amber offline banner with snapshot timestamp

### 4. Hospital list (data)
- `EMERGENCY_PLACES` in official feeds for future “navigate to hospital” shortcuts

---

## Demo checklist

1. Tap **Civic** → read city notices; toggle **Emergency priority**  
2. Search a route — with Emergency on, risky paths should be penalized more  
3. DevTools → Network → Offline → reload → should see offline banner + cached segments  

---

## Not yet

- Live police/BBMP API integration  
- True geofenced hospital corridor routing  
- Full offline map tiles pack  

---

## Git tag

`phase-6-complete`
