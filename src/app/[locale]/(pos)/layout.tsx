'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Sidebar } from '@/components/layout/Sidebar';
import { TableRequestToast } from '@/components/pos/TableRequestToast';
import { addRequest } from '@/lib/table-requests';
import { getActiveShift, subscribeShift } from '@/lib/shift-session';
import { getAuthSession, subscribeAuthSession } from '@/lib/auth-session';

// TEMP: stand-in for the real customer/QR backend. Surfaces an occasional mock
// table request so the cashier notification + sidebar badge can be exercised;
// remove once table requests arrive from the API.
const SIMULATE_TABLE_REQUESTS = true;

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Auth gate: every POS route requires a signed-in cashier. Checked first —
  // without a session the app redirects to the Login screen.
  const [authed, setAuthed] = useState<boolean | null>(null);
  // Shift gate: every POS route requires an active shift. Without one, the app
  // cannot be opened — everything redirects to the Start Shift screen.
  const [hasShift, setHasShift] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(Boolean(getAuthSession()));
    return subscribeAuthSession(() => setAuthed(Boolean(getAuthSession())));
  }, []);

  useEffect(() => {
    setHasShift(Boolean(getActiveShift()));
    return subscribeShift(() => setHasShift(Boolean(getActiveShift())));
  }, []);

  useEffect(() => {
    if (authed === false) router.replace('/login');
  }, [authed, router]);

  useEffect(() => {
    if (hasShift === false) router.replace('/shift');
  }, [hasShift, router]);

  // Mock customer table requests (unchanged).
  useEffect(() => {
    if (!SIMULATE_TABLE_REQUESTS) return;
    // Table codes (A02…) are locale-neutral; the “Table ” prefix is added at
    // render time by the localized components, so seeds stay language-agnostic.
    const tables = ['Table A02', 'Table A05', 'Table A07', 'Table B01', 'Table C01'];
    const tick = () => {
      addRequest({
        table: tables[Math.floor(Math.random() * tables.length)],
        type: Math.random() < 0.5 ? 'Waiter Requested' : 'Check Requested',
        paymentMethod: Math.random() < 0.5 ? 'Card' : 'Cash',
      });
    };
    const first = setTimeout(tick, 7000);
    const interval = setInterval(tick, 45_000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, []);

  // Nothing renders (not even the sidebar) until the auth + shift checks resolve.
  if (authed === null || hasShift === null) {
    return <div className="min-h-screen bg-[#F2F2F2]" />;
  }

  if (!authed || !hasShift) {
    return <div className="min-h-screen bg-[#F2F2F2]" />;
  }

  return (
    // Fixed app shell: the document itself never scrolls, so the sidebar stays
    // put and there is no page-level overscroll/bounce. Only the content column
    // scrolls, and only when its content actually overflows the viewport.
    <div className="h-screen overflow-hidden bg-[#F2F2F2]">
      <Sidebar />
      {/* Offset equals the fixed sidebar (start-3 + w-[89px] + gap) — logical
          properties so the content shifts correctly in RTL too. */}
      <div className="h-screen overflow-y-auto overscroll-none ps-[119px] pe-[15px] pt-[26px] pb-3">
        {children}
      </div>
      <TableRequestToast />
    </div>
  );
}
