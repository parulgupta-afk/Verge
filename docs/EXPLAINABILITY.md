# Explainability (Verge differentiator)

## Trust fixes (004)
- Migration `003` no longer ends with a stray `EOF`
- Migration `004_trust_scored_once.sql`: `reports.trust_scored_at` so `refresh_reporter_trust()` counts each report **once**

## Audit timeline
- `fetchSegmentHistory(segmentId)` loads reports + confirmations
- `SegmentDetailSheet` shows **Status history** with trust label (not real names)
- Empty on local seed until Supabase is connected

## Confidence as visual language
- Map line **opacity** scales with `confidence` (low confidence = more transparent)
- Heatmap mode still thickens high-confidence lines
- Status color remains (blocked/partial/clear)

## Apply on Supabase
1. 001, 002, 003 (fixed), 004
2. Enable Anonymous auth
3. Cron: `SELECT refresh_reporter_trust();`
