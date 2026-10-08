'use client';

import { useEffect } from 'react';

// Ref-counted: several overlays can be open at once (e.g. a confirm on top of a
// modal), and only the last one to close may restore scrolling — otherwise a
// closing child would unlock the page while its parent is still open.
let lockCount = 0;
let prevBodyOverflow = '';
let prevHtmlOverflow = '';

/**
 * Locks body scrolling while `locked` is true (a modal/overlay is open) and
 * restores the previous state when the last overlay closes. Overlays cover the
 * viewport and scroll internally, so the page behind them must not scroll.
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;
    const body = document.body;
    const html = document.documentElement;
    if (lockCount === 0) {
      prevBodyOverflow = body.style.overflow;
      prevHtmlOverflow = html.style.overflow;
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';
    }
    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        body.style.overflow = prevBodyOverflow;
        html.style.overflow = prevHtmlOverflow;
      }
    };
  }, [locked]);
}
