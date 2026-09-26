'use client';

// App entry: with no active shift the POS is locked — land on Start Shift.
// Once a shift is running, go straight to the Floor Plan.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveShift, subscribeShift } from '@/lib/shift-session';

export default function Home() {
  const router = useRouter();
  const [hasShift, setHasShift] = useState<boolean | null>(null);

  useEffect(() => {
    setHasShift(Boolean(getActiveShift()));
    return subscribeShift(() => setHasShift(Boolean(getActiveShift())));
  }, []);

  useEffect(() => {
    if (hasShift === null) return;
    router.replace(hasShift ? '/floor-plan' : '/shift');
  }, [hasShift, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F2F2F2]">
      <p className="text-[15px] font-medium text-[#989898]">Loading…</p>
    </div>
  );
}
