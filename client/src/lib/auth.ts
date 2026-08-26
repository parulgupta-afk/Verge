/**
 * Supabase anonymous auth → real user_id for trust-weighted votes
 * Replaces pure localStorage device_id as the identity of record when configured.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { getDeviceId } from './identity';

let cachedAppUserId: string | null = null;
let cachedAuthUid: string | null = null;

export async function ensureAnonymousAuth(): Promise<{
  authUid: string | null;
  appUserId: string | null;
  deviceId: string;
}> {
  const deviceId = getDeviceId();

  if (!isSupabaseConfigured || !supabase) {
    return { authUid: null, appUserId: null, deviceId };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    let authUid = sessionData.session?.user?.id ?? null;

    if (!authUid) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.warn('[Verge] anonymous auth failed:', error.message);
        return { authUid: null, appUserId: null, deviceId };
      }
      authUid = data.user?.id ?? null;
    }

    cachedAuthUid = authUid;

    if (authUid) {
      const { data: appUserId, error: rpcErr } = await supabase.rpc('ensure_app_user', {
        p_auth_uid: authUid,
        p_display: 'anon',
      });
      if (rpcErr) {
        console.warn('[Verge] ensure_app_user:', rpcErr.message);
      } else {
        cachedAppUserId = appUserId as string;
      }
    }

    return {
      authUid: cachedAuthUid,
      appUserId: cachedAppUserId,
      deviceId,
    };
  } catch (e) {
    console.warn('[Verge] ensureAnonymousAuth', e);
    return { authUid: null, appUserId: null, deviceId };
  }
}

export function getCachedAppUserId(): string | null {
  return cachedAppUserId;
}
