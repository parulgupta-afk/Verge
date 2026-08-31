# Place search autocomplete (Nominatim)

## What this fixes
- From/To and Search were limited to a few hardcoded places.
- Now you can type **any place in India**; suggestions appear after ~400ms.
- Quick picks (seeded list) still work offline.

## Files
- `client/src/lib/geocode.ts` — Nominatim search (free, no key)
- `client/src/components/RoutePlanner.tsx` — From/To with typeahead
- `client/src/components/SearchOverlay.tsx` — Search overlay typeahead
- `client/src/data/indiaPlaces.ts` — `city` type allows any string

## How to use
1. **Directions** → type in **To** (e.g. "India Gate", "Koramangala 5th block")
2. Wait for **Search results** → tap one → **Calculate route**
3. Or use map **Search** the same way

Needs network for live suggestions. Rate-limit: we debounce 400ms.
