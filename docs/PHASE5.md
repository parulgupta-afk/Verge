# Phase 5 — Predictive & risk-aware routing (complete package)

**Goal:** Prefer routes that avoid high-confidence blockages, not only the shortest time.

---

## Formula (MVP)

```
route cost =
    travel_time (seconds)
  + blockage_probability × penalty
```

- `travel_time` from OSRM  
- `blockage_probability` from segment status + confidence (see `lib/risk.ts`)  
- `penalty` ≈ 10 minutes (600s) when the path crosses a risky segment  

---

## What Phase 5 includes

| Piece | File |
|-------|------|
| Segment risk probability | `client/src/lib/risk.ts` |
| Score + rank routes | `scoreRoute`, `rankRoutes` |
| Trade-off summary text | `buildComparisonSummary` |
| OSRM alternatives | `fetchRouteAlternatives` in `routing.ts` |
| App picks lowest-cost route | `navigateToPlace` in `App.tsx` |

---

## Flow

1. User searches a destination  
2. App requests main route + alternatives from OSRM  
3. Each route is scored against current segment risks  
4. Best cost route is drawn on the map  
5. Banner shows comparison / trade-off summary  
6. Voice speaks a short recommendation or blockage warning  

---

## Demo checklist

1. `npm run dev` → Delhi map  
2. Search **IIT Delhi** or **AIIMS** (may interact with seeded blockages)  
3. Banner should mention risk / recommended route, not only ETA  
4. Confirm a segment blocked with high confidence → search again → ranking should prefer avoiding it when alternatives exist  

---

## Not yet (later)

- True historical pattern model from DB time-series  
- LLM-written multi-paragraph trade-offs  
- Mapbox exclude polygons  
- Custom PostGIS graph (Phase 3 V2 from original PRD)  

---

## Git tag

`phase-5-complete`
