import React, { useEffect, useState } from 'react';
import { isBackendReady, onBackendReady, waitForBackend } from '@/lib/apiClient';

// Ping every 10 minutes (Render free tier sleeps after 15 minutes of inactivity)
const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000;

/**
 * BackendWakeup Component:
 * 1. Pings the backend immediately when any visitor lands on the site.
 * 2. Runs a periodic heartbeat every 10 min to keep Render awake while the tab is open.
 * 3. Wakes up the server if the user returns to the tab after being away.
 */
export default function BackendWakeup({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1. Immediate wake-up ping on mount
    waitForBackend();

    // 2. Periodic keep-alive heartbeat while the tab is active
    const interval = setInterval(() => {
      waitForBackend();
    }, KEEP_ALIVE_INTERVAL_MS);

    // 3. Keep-alive ping when user focuses or returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        waitForBackend();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, []);

  return <>{children}</>;
}

/**
 * Hook to check if the backend is awake.
 */
export function useBackendReady(): boolean {
  const [ready, setReady] = useState(isBackendReady);

  useEffect(() => {
    if (ready) return;
    return onBackendReady(() => setReady(true));
  }, [ready]);

  return ready;
}
