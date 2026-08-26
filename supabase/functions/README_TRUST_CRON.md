# Trust refresh cron

Call Postgres every few hours:

```sql
SELECT refresh_reporter_trust();
```

## Supabase schedule (Dashboard)

1. Database → Extensions → enable `pg_cron` if available  
2. Or Edge Function on a cron that runs:

```ts
await supabase.rpc('refresh_reporter_trust')
```

Using service role key.

This updates `users.reports_total`, `reports_upheld`, and `trust_weight`.
