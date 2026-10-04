'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Query-driven open state for modals/drawers/dialogs.
 *
 * Replaces `useState(false)` so every overlay is deep-linkable:
 * `?modal=<name>` opens it, closing removes it, and the browser Back
 * button closes it. Payload data (edit targets, ids) stays in component
 * state — see `readQueryParam`/`writeQueryParam` for the `id`/`step`
 * companions. No visual/UI change: same components, same styling.
 *
 * Uses `window.history` directly (no Next router), so no Suspense
 * boundary is needed and locale prefixes are untouched.
 */
export function readQueryParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get(key);
  } catch {
    return null;
  }
}

export function writeQueryParam(key: string, value: string | null, push: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
    window.history[push ? 'pushState' : 'replaceState'](null, '', url.toString());
  } catch {
    // non-browser / unsupported — state still updates locally
  }
}

export function useQueryModal(name: string, param = 'modal'): [boolean, (open: boolean) => void] {
  const [open, setOpenState] = useState(false);
  const pushedRef = useRef(false);

  useEffect(() => {
    const sync = () => setOpenState(readQueryParam(param) === name);
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [name, param]);

  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next);
      if (typeof window === 'undefined') return;
      try {
        const url = new URL(window.location.href);
        if (next) {
          if (url.searchParams.get(param) === name) return;
          url.searchParams.set(param, name);
          window.history.pushState(null, '', url.toString());
          pushedRef.current = true;
        } else if (url.searchParams.get(param) === name) {
          if (pushedRef.current) {
            pushedRef.current = false;
            window.history.back();
          } else {
            url.searchParams.delete(param);
            window.history.replaceState(null, '', url.toString());
          }
        }
      } catch {
        // ignore — local state already updated
      }
    },
    [name, param],
  );

  return [open, setOpen] as const;
}
