'use client';

import { useEffect } from 'react';

/**
 * Locks body scrolling while `locked` is true (a modal/overlay is open) and
 * restores the previous state on cleanup. Overlays cover the viewport and
 * scroll internally, so the page behind them must not scroll.
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;
    const body = document.body;
    const html = document.documentElement;
    const prevOverflow = body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;

    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';

    return () => {
      body.style.overflow = prevOverflow;
      html.style.overflow = prevHtmlOverflow;
    };
  }, [locked]);
}
