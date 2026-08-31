/**
 * Client helper for optional photo evidence checks.
 * Calls server /api/media/check when VITE_API_URL is set.
 * Without a server key, server returns verified: null (aspirational).
 */

export type MediaCheckResult = {
  verified: boolean | null;
  note: string;
  confidence?: number;
  model?: string | null;
};

const API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  'http://localhost:4000';

export async function checkMediaEvidence(params: {
  mediaUrl: string;
  type?: string;
}): Promise<MediaCheckResult> {
  try {
    const res = await fetch(`${API_BASE}/api/media/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_url: params.mediaUrl,
        type: params.type || 'blocked',
      }),
    });
    if (!res.ok) {
      return {
        verified: null,
        note: `Media check HTTP ${res.status}`,
      };
    }
    return (await res.json()) as MediaCheckResult;
  } catch {
    return {
      verified: null,
      note: 'Media check unavailable (server offline or no API key). Photo is stored as evidence only.',
    };
  }
}
