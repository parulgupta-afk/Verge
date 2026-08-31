import { supabase, isSupabaseConfigured } from './supabase';
import type { RoadSegment, ReportStatus } from '../types';
import { INDIA_SEED_SEGMENTS } from '../data/indiaSeedSegments';
import { getDeviceId } from './identity';
import { ensureAnonymousAuth } from './auth';

/** Map DB row → frontend RoadSegment */
function rowToSegment(row: any): RoadSegment {
  let geometry: GeoJSON.LineString | undefined;
  if (row.geometry) {
    // PostGIS can return GeoJSON via ST_AsGeoJSON or as parsed object
    if (typeof row.geometry === 'string') {
      try {
        geometry = JSON.parse(row.geometry);
      } catch {
        geometry = undefined;
      }
    } else if (row.geometry.type === 'LineString') {
      geometry = row.geometry;
    } else if (row.geometry.coordinates) {
      geometry = { type: 'LineString', coordinates: row.geometry.coordinates };
    }
  }

  return {
    id: row.id,
    name: row.name,
    roadCode: row.road_code ?? undefined,
    city: row.city ?? undefined,
    status: (row.status as ReportStatus) || 'unknown',
    confidence: Number(row.confidence) || 0,
    confirms: Number(row.confirms) || 0,
    refutes: Number(row.refutes) || 0,
    updatedAt: row.last_updated
      ? formatRelativeTime(row.last_updated)
      : '—',
    location: row.city ?? undefined,
    description: row.metadata?.description ?? undefined,
    geometry,
  };
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export interface FetchSegmentsResult {
  segments: RoadSegment[];
  isDbLive: boolean;
  notice?: string;
}

export let isSupabaseDatabaseReady = false;

/** Fetch all segments (or by city) and return live database status */
export async function fetchSegmentsWithStatus(city?: string): Promise<FetchSegmentsResult> {
  if (!isSupabaseConfigured || !supabase) {
    isSupabaseDatabaseReady = false;
    const fallback = city
      ? INDIA_SEED_SEGMENTS.filter((s) => s.city?.toLowerCase() === city.toLowerCase())
      : INDIA_SEED_SEGMENTS;
    return {
      segments: fallback,
      isDbLive: false,
    };
  }

  try {
    let query = supabase
      .from('road_segments')
      .select('id, name, road_code, city, status, confidence, confirms, refutes, last_updated, metadata, geometry');

    if (city) {
      query = query.eq('city', city);
    }

    const { data, error } = await query.order('last_updated', { ascending: false });

    if (error) {
      isSupabaseDatabaseReady = false;
      const fallback = city
        ? INDIA_SEED_SEGMENTS.filter((s) => s.city?.toLowerCase() === city.toLowerCase())
        : INDIA_SEED_SEGMENTS;

      return {
        segments: fallback,
        isDbLive: false,
      };
    }

    isSupabaseDatabaseReady = true;

    if (!data || data.length === 0) {
      return {
        segments: INDIA_SEED_SEGMENTS,
        isDbLive: true,
      };
    }

    return {
      segments: data.map(rowToSegment),
      isDbLive: true,
    };
  } catch (e: any) {
    isSupabaseDatabaseReady = false;
    const fallback = city
      ? INDIA_SEED_SEGMENTS.filter((s) => s.city?.toLowerCase() === city.toLowerCase())
      : INDIA_SEED_SEGMENTS;
    return {
      segments: fallback,
      isDbLive: false,
      notice: 'Supabase unreachable — using local seed data.',
    };
  }
}

/** Fetch all segments (or by city). Falls back to seed data. */
export async function fetchSegments(city?: string): Promise<RoadSegment[]> {
  const result = await fetchSegmentsWithStatus(city);
  return result.segments;
}

const VOTE_RADIUS_M = 5000; // 5 km — PRD proximity rule

export type GeoPoint = { lat: number; lng: number };

/**
 * Upload evidence photo to Supabase Storage and return its public URL.
 * This does NOT verify the photo's content — media_verified stays NULL
 * until a real check (e.g. /api/media/check with a vision model) runs.
 * Returns null if upload fails or Supabase isn't configured; callers
 * should treat that as "no media attached", never as "verified".
 */
export async function uploadReportMedia(file: File): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase || !isSupabaseDatabaseReady) {
    return null;
  }
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `reports/${crypto.randomUUID()}.${ext}`;

  try {
    const { error } = await supabase.storage.from('report-media').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      console.info('[Verge] report-media upload skipped:', error.message);
      return null;
    }

    const { data } = supabase.storage.from('report-media').getPublicUrl(path);
    return data.publicUrl ?? null;
  } catch {
    return null;
  }
}

/** Submit a report; confidence is recalculated ONLY via Postgres RPC (source of truth). */
export async function submitReport(params: {
  segmentId: string;
  type: ReportStatus;
  notes?: string;
  mediaUrl?: string;
  location?: GeoPoint | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase || !isSupabaseDatabaseReady) {
    return { ok: true };
  }

  try {
    const { appUserId, deviceId } = await ensureAnonymousAuth();
    const actor = appUserId || deviceId;

    try {
      const { data: allowed } = await supabase.rpc('check_rate_limit', {
        p_actor: actor,
        p_action: 'report',
        p_max: 15,
        p_window_minutes: 60,
      });
      if (allowed === false) {
        return { ok: false, error: 'Rate limit: too many reports. Try again later.' };
      }
    } catch {
      // rate limit RPC optional
    }

    const { error } = await supabase.from('reports').insert({
      segment_id: params.segmentId,
      reporter_id: appUserId,
      type: params.type === 'unknown' ? 'blocked' : params.type,
      notes: params.notes ?? null,
      media_url: params.mediaUrl ?? null,
      reporter_lat: params.location?.lat ?? null,
      reporter_lng: params.location?.lng ?? null,
    });

    if (error) {
      console.info('[Verge] submitReport notice:', error.message);
      return { ok: true };
    }

    try {
      await supabase.rpc('recalculate_segment_confidence', {
        p_segment_id: params.segmentId,
      });
    } catch {
      // RPC optional
    }

    return { ok: true };
  } catch {
    return { ok: true };
  }
}

/**
 * Confirm / refute with:
 * - real user_id when anonymous auth works
 * - 5 km proximity check when GPS provided
 * - rate limit
 * - confidence via Postgres RPC only
 */
export async function voteOnSegment(
  segmentId: string,
  type: 'confirm' | 'refute',
  location?: GeoPoint | null
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase || !isSupabaseDatabaseReady) {
    return { ok: true };
  }

  try {
    const { appUserId, deviceId } = await ensureAnonymousAuth();
    const actor = appUserId || deviceId;

    try {
      const { data: allowed } = await supabase.rpc('check_rate_limit', {
        p_actor: actor,
        p_action: 'vote',
        p_max: 30,
        p_window_minutes: 60,
      });
      if (allowed === false) {
        return { ok: false, error: 'Rate limit: too many votes. Try again later.' };
      }
    } catch {
      // RPC optional
    }

    // Proximity: require location within 5 km of segment when coords provided
    if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      try {
        const { data: distM, error: distErr } = await supabase.rpc('segment_distance_m', {
          p_segment_id: segmentId,
          p_lng: location.lng,
          p_lat: location.lat,
        });
        if (!distErr && distM != null && Number(distM) > VOTE_RADIUS_M) {
          return {
            ok: false,
            error: `Too far from this road to vote (${Math.round(Number(distM) / 1000)} km away; need ≤ 5 km).`,
          };
        }
      } catch {
        // RPC optional
      }
    }

    const payload: Record<string, unknown> = {
      segment_id: segmentId,
      type,
      device_id: deviceId,
      user_id: appUserId,
      voter_lat: location?.lat ?? null,
      voter_lng: location?.lng ?? null,
    };

    // Prefer user-scoped unique vote
    let error;
    if (appUserId) {
      const res = await supabase.from('confirmations').upsert(payload, {
        onConflict: 'segment_id,user_id',
      });
      error = res.error;
    } else {
      const res = await supabase.from('confirmations').upsert(payload, {
        onConflict: 'segment_id,device_id',
      });
      error = res.error;
    }

    if (error) {
      const { error: insertError } = await supabase.from('confirmations').insert(payload);
      if (insertError) {
        console.info('[Verge] voteOnSegment notice:', insertError.message);
      }
    }

    // Single source of truth
    try {
      await supabase.rpc('recalculate_segment_confidence', {
        p_segment_id: segmentId,
      });
    } catch {
      // RPC optional
    }

    return { ok: true };
  } catch {
    return { ok: true };
  }
}

/** Subscribe to road_segments changes (Realtime) with unique channel identifier */
export function subscribeToSegments(
  onChange: (segment: RoadSegment) => void
): () => void {
  if (!isSupabaseConfigured || !supabase || !isSupabaseDatabaseReady) {
    return () => {};
  }

  try {
    const channelId = `segments_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'road_segments' },
        (payload) => {
          if (payload.new) {
            onChange(rowToSegment(payload.new));
          }
        }
      )
      .subscribe();

    return () => {
      try {
        if (supabase) {
          supabase.removeChannel(channel);
        }
      } catch {
        // ignore removal error on cleanup
      }
    };
  } catch (e) {
    console.info('[Verge] Realtime subscription skipped:', e);
    return () => {};
  }
}

