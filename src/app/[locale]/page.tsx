'use client';

// App entry: not signed in → Login. Signed in with no active shift → Start
// Shift. Once a shift is running, go straight to the Floor Plan.

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { getActiveShift, subscribeShift } from '@/lib/shift-session';
import { getAuthSession, subscribeAuthSession } from '@/lib/auth-session';

export default function Home() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
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
    if (authed === null || hasShift === null) return;
    if (!authed) {
      router.replace('/login');
      return;
    }
    router.replace(hasShift ? '/floor-plan' : '/shift');
  }, [authed, hasShift, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F2F2F2]">
      <p className="text-[15px] font-medium text-[#989898]">Loading…</p>
    </div>
  );
}
