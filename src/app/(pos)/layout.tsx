'use client';

import { Sidebar } from '@/components/layout/Sidebar';

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Sidebar />
      <div className="pl-[104px] pr-3 pt-3 pb-3 min-h-screen">
        {children}
      </div>
    </div>
  );
}
