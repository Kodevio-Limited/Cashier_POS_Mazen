'use client';

import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TableRequestToast } from '@/components/pos/TableRequestToast';
import { addRequest } from '@/lib/table-requests';

// TEMP: stand-in for the real customer/QR backend. Surfaces an occasional mock
// table request so the cashier notification + sidebar badge can be exercised;
// remove once table requests arrive from the API.
const SIMULATE_TABLE_REQUESTS = true;

export default function PosLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!SIMULATE_TABLE_REQUESTS) return;
    const tables = ['Table 2', 'Table 5', 'Table 7', 'Table 11', 'Table 14'];
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
