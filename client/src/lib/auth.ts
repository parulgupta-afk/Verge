/**
 * Supabase anonymous auth → real user_id for trust-weighted votes
 * Replaces pure localStorage device_id as the identity of record when configured.
 * Gracefully falls back to device_id if anonymous auth is disabled on the Supabase project.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { getDeviceId } from './identity';

let cachedAppUserId: string | null = null;
let cachedAuthUid: string | null = null;
let anonymousAuthDisabled = false;
let authPromise: Promise<{
  authUid: string | null;
  appUserId: string | null;
  deviceId: string;
}> | null = null;

export async function ensureAnonymousAuth(): Promise<{
  authUid: string | null;
  appUserId: string | null;
  deviceId: string;
}> {
  const deviceId = getDeviceId();

  if (!isSupabaseConfigured || !supabase) {
    return { authUid: null, appUserId: null, deviceId };
  }

  if (cachedAuthUid) {
    return {
      authUid: cachedAuthUid,
      appUserId: cachedAppUserId,
      deviceId,
    };
  }

  // Deduplicate concurrent calls during React mount / strict mode
  if (authPromise) {
    return authPromise;
  }

  const shouldAttemptAnonAuth =
    import.meta.env.VITE_ENABLE_ANONYMOUS_AUTH === 'true';

  authPromise = (async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      let authUid = sessionData.session?.user?.id ?? null;

      if (!authUid && shouldAttemptAnonAuth && !anonymousAuthDisabled) {
        try {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) {
            if (
              error.message?.toLowerCase().includes('disabled') ||
              error.status === 422
            ) {
              anonymousAuthDisabled = true;
              console.info(
                '[Verge] Anonymous sign-ins not enabled in Supabase project settings. Operating in guest mode with device ID.'
              );
            } else {
              console.info('[Verge] Anonymous auth notice:', error.message);
            }
          } else {
            authUid = data.user?.id ?? null;
          }
        } catch {
          anonymousAuthDisabled = true;
        }
      }

      cachedAuthUid = authUid;


      if (authUid) {
        try {
          const { data: appUserId, error: rpcErr } = await supabase.rpc('ensure_app_user', {
            p_auth_uid: authUid,
            p_display: 'anon',
          });
          if (!rpcErr && appUserId) {
            cachedAppUserId = appUserId as string;
          }
        } catch {
          // ensure_app_user RPC optional if migrations not yet applied
        }
      }

      return {
        authUid: cachedAuthUid,
        appUserId: cachedAppUserId,
        deviceId,
      };
    } catch {
      return { authUid: null, appUserId: null, deviceId };
    } finally {
      authPromise = null;
    }
  })();

  return authPromise;
}

export function getCachedAppUserId(): string | null {
  return cachedAppUserId;
}

