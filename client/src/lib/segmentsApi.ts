import { supabase, isSupabaseConfigured } from './supabase';
import type { RoadSegment, ReportStatus } from '../types';
import { INDIA_SEED_SEGMENTS } from '../data/indiaSeedSegments';
import { getDeviceId } from './identity';

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

/** Fetch all segments (or by city). Falls back to seed data. */
export async function fetchSegments(city?: string): Promise<RoadSegment[]> {
  if (!isSupabaseConfigured || !supabase) {
    return city
      ? INDIA_SEED_SEGMENTS.filter((s) => s.city?.toLowerCase() === city.toLowerCase())
      : INDIA_SEED_SEGMENTS;
  }

  // Use a view or select with ST_AsGeoJSON for geometry
  // Prefer GeoJSON: create a DB view or use RPC with ST_AsGeoJSON in production.
  // For now we select geometry as stored; client maps what it can.
  let query = supabase
    .from('road_segments')
    .select('id, name, road_code, city, status, confidence, confirms, refutes, last_updated, metadata, geometry');

  if (city) {
    query = query.eq('city', city);
  }

  const { data, error } = await query.order('last_updated', { ascending: false });

  if (error) {
    console.error('[Verge] fetchSegments error:', error.message);
    return INDIA_SEED_SEGMENTS;
  }

  if (!data || data.length === 0) {
    return INDIA_SEED_SEGMENTS;
  }

  return data.map(rowToSegment);
}

/** Submit a report and optimistically update confidence locally; server/DB does real calc. */
export async function submitReport(params: {
  segmentId: string;
  type: ReportStatus;
  notes?: string;
  mediaUrl?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: true }; // local mode — App handles state
  }

  const { error } = await supabase.from('reports').insert({
    segment_id: params.segmentId,
    type: params.type === 'unknown' ? 'blocked' : params.type,
    notes: params.notes ?? null,
    media_url: params.mediaUrl ?? null,
  });

  if (error) {
    console.error('[Verge] submitReport error:', error.message);
    return { ok: false, error: error.message };
  }

  // Trigger confidence recalculation via RPC if available
  try {
    await supabase.rpc('recalculate_segment_confidence', {
      p_segment_id: params.segmentId,
    });
  } catch {
    /* RPC may not exist yet */
  }

  return { ok: true };
}

/** Confirm or refute a segment */
export async function voteOnSegment(
  segmentId: string,
  type: 'confirm' | 'refute'
): Promise<{ ok: boolean; error?: string }> {
  const deviceId = getDeviceId();
  if (!isSupabaseConfigured || !supabase) {
    return { ok: true };
  }
  void deviceId; // reserved for auth-linked votes in Phase 2+

  const { error } = await supabase.from('confirmations').upsert(
    {
      segment_id: segmentId,
      type,
    },
    { onConflict: 'segment_id,user_id' }
  );

  if (error) {
    // If unique constraint fails without auth user, try plain insert
    const { error: insertError } = await supabase.from('confirmations').insert({
      segment_id: segmentId,
      type,
    });
    if (insertError) {
      console.error('[Verge] voteOnSegment error:', insertError.message);
      return { ok: false, error: insertError.message };
    }
  }

  try {
    await supabase.rpc('recalculate_segment_confidence', {
      p_segment_id: segmentId,
    });
  } catch {
    /* RPC may not exist yet */
  }

  return { ok: true };
}

/** Subscribe to road_segments changes (Realtime) */
export function subscribeToSegments(
  onChange: (segment: RoadSegment) => void
): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  const channel = supabase
    .channel('road_segments_changes')
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
    supabase.removeChannel(channel);
  };
}
