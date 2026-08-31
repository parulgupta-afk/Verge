import { useState, useEffect, useCallback } from 'react';
import type { RoadSegment, ReportStatus } from '../types';
import { INDIA_SEED_SEGMENTS } from '../data/indiaSeedSegments';
import { fetchSegments, voteOnSegment, submitReport, subscribeToSegments } from '../lib/segmentsApi';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  saveSegmentSnapshot,
  loadSegmentSnapshot,
  snapshotMeta,
  isProbablyOffline,
} from '../lib/offlineCache';

type Geo = { lat: number; lng: number } | null;

/**
 * Segment load, realtime, offline snapshot, confirm/refute/report.
 * Extracted from App.tsx for separation of concerns.
 */
export function useSegments() {
  const [segments, setSegments] = useState<RoadSegment[]>(INDIA_SEED_SEGMENTS);
  const [dataSource, setDataSource] = useState<'local' | 'supabase'>('local');
  const [offlineBanner, setOfflineBanner] = useState<string | null>(null);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      if (isProbablyOffline()) {
        const cached = loadSegmentSnapshot();
        if (cached?.length) {
          setSegments(cached);
          setDataSource('local');
          const meta = snapshotMeta();
          setOfflineBanner(
            meta?.savedAt
              ? `Offline — showing snapshot from ${new Date(meta.savedAt).toLocaleString()}`
              : 'Offline — showing last saved snapshot'
          );
          return;
        }
        setOfflineBanner('Offline — using built-in India seed data');
      }
      const data = await fetchSegments();
      setSegments(data);
      setDataSource(isSupabaseConfigured ? 'supabase' : 'local');
      saveSegmentSnapshot(data);
      setOfflineBanner(null);

      unsub = subscribeToSegments((seg) => {
        setSegments((prev) => {
          const i = prev.findIndex((s) => s.id === seg.id);
          if (i < 0) return [...prev, seg];
          const next = [...prev];
          next[i] = { ...next[i], ...seg };
          return next;
        });
      });
    })();
    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem('verge_segments_india', JSON.stringify(segments));
    if (segments.length) saveSegmentSnapshot(segments);
  }, [segments]);

  const confirm = useCallback(
    (segmentId: string, location?: Geo) => {
      setSegments((prev) =>
        prev.map((s) => {
          if (s.id !== segmentId) return s;
          const confirms = s.confirms + 1;
          const confidence = Math.min(100, s.confidence + 8);
          return { ...s, confirms, confidence, updatedAt: 'Just now' };
        })
      );
      voteOnSegment(segmentId, 'confirm', location ?? null);
    },
    []
  );

  const refute = useCallback(
    (segmentId: string, location?: Geo) => {
      setSegments((prev) =>
        prev.map((s) => {
          if (s.id !== segmentId) return s;
          const refutes = s.refutes + 1;
          const confidence = Math.max(0, s.confidence - 10);
          return { ...s, refutes, confidence, updatedAt: 'Just now' };
        })
      );
      voteOnSegment(segmentId, 'refute', location ?? null);
    },
    []
  );

  const report = useCallback(
    (params: {
      segmentId: string;
      type: ReportStatus;
      notes?: string;
      mediaUrl?: string;
      location?: Geo;
    }) => {
      setSegments((prev) =>
        prev.map((s) =>
          s.id === params.segmentId
            ? {
                ...s,
                status: params.type === 'unknown' ? s.status : params.type,
                updatedAt: 'Just now',
                confirms: s.confirms + 1,
                confidence: Math.min(100, s.confidence + 12),
              }
            : s
        )
      );
      submitReport({
        segmentId: params.segmentId,
        type: params.type,
        notes: params.notes,
        mediaUrl: params.mediaUrl,
        location: params.location,
      });
    },
    []
  );

  return {
    segments,
    setSegments,
    dataSource,
    offlineBanner,
    confirm,
    refute,
    report,
  };
}
