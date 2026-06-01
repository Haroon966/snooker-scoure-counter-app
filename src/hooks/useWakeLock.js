import { useEffect, useRef } from 'react';

/**
 * Keeps the screen on while `enabled` is true (Screen Wake Lock API).
 */
export function useWakeLock(enabled) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return undefined;
    }

    let cancelled = false;

    const acquire = async () => {
      try {
        if (document.visibilityState !== 'visible') return;
        if (sentinelRef.current) return;
        const sentinel = await navigator.wakeLock.request('screen');
        if (cancelled) {
          await sentinel.release();
          return;
        }
        sentinelRef.current = sentinel;
        sentinel.addEventListener('release', () => {
          sentinelRef.current = null;
        });
      } catch {
        /* unsupported or denied */
      }
    };

    const release = async () => {
      if (sentinelRef.current) {
        try {
          await sentinelRef.current.release();
        } catch {
          /* ignore */
        }
        sentinelRef.current = null;
      }
    };

    acquire();

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && enabled) {
        acquire();
      } else {
        release();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      release();
    };
  }, [enabled]);
}
