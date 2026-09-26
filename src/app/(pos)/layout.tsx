'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TableRequestToast } from '@/components/pos/TableRequestToast';
import { addRequest } from '@/lib/table-requests';
import { getActiveShift, subscribeShift } from '@/lib/shift-session';

// TEMP: stand-in for the real customer/QR backend. Surfaces an occasional mock
// table request so the cashier notification + sidebar badge can be exercised;
// remove once table requests arrive from the API.
const SIMULATE_TABLE_REQUESTS = true;

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Shift gate: every POS route requires an active shift. Without one, the app
  // cannot be opened — everything redirects to the Start Shift screen.
  const [hasShift, setHasShift] = useState<boolean | null>(null);

  useEffect(() => {
    setHasShift(Boolean(getActiveShift()));
    return subscribeShift(() => setHasShift(Boolean(getActiveShift())));
  }, []);

  useEffect(() => {
    if (hasShift === false) router.replace('/shift');
  }, [hasShift, router]);

  // Mock customer table requests (unchanged).
  useEffect(() => {
    if (!SIMULATE_TABLE_REQUESTS) return;
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

  // Nothing renders (not even the sidebar) until the shift check resolves.
  if (hasShift === null) {
    return <div className="min-h-screen bg-[#F2F2F2]" />;
  }

  if (!hasShift) {
    return <div className="min-h-screen bg-[#F2F2F2]" />;
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Sidebar />
      <div className="pl-[119px] pr-[15px] pt-[26px] pb-3 min-h-screen">
        {children}
      </div>
      <TableRequestToast />
    </div>
  );
}
