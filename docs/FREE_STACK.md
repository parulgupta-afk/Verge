# Verge free stack (no Mapbox)

| Layer | Service | Key / card? |
|-------|---------|-------------|
| Map engine | **MapLibre GL JS** | No |
| Map style/tiles | **OpenFreeMap** (default) or OSM raster | No |
| Routing | **Public OSRM** `router.project-osrm.org` | No |
| Voice | **Web Speech API** | No |
| Backend (optional) | Supabase free tier | Signup, no Mapbox |

## Do not add
- `mapbox-gl`
- `VITE_MAPBOX_TOKEN` / `MAPBOX_ACCESS_TOKEN`
- Mapbox Directions API

## If OpenFreeMap is slow
`mapConfig.ts` can switch `MAP_STYLE_URL` to:
- `https://demotiles.maplibre.org/style.json`
- or use `OSM_RASTER_STYLE` in MapView

## Production routing later
Self-host **OSRM** or **Valhalla** / **GraphHopper** — still no Mapbox.
