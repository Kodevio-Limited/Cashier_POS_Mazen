'use client';

// Start Shift — the app's login gate. Lives OUTSIDE the (pos) shell so it shows
// standalone, without the sidebar. Until a shift is started, every POS route
// redirects here (see (pos)/layout.tsx) — the app cannot be opened without it.
// Figma ref (737:746), pixel-matched from the original (pos)/shift page.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { getActiveShift, startShift } from '@/lib/shift-session';

const CASHIERS = ['Alex m', 'Sarah J', 'Mike T'];

export default function ShiftPage() {
  const router = useRouter();
  const [cashier, setCashier] = useState(CASHIERS[0]);
  const [pin, setPin] = useState('');
  const [floatInput, setFloatInput] = useState('$50.00');
  const [formError, setFormError] = useState('');

  // Already logged in (a shift is running)? Straight into the POS.
  useEffect(() => {
    if (getActiveShift()) router.replace('/floor-plan');
  }, [router]);

  function parseFloatAmount(raw: string): number {
    const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : NaN;
  }

  function handleStartShift() {
    if (!pin.trim()) {
      setFormError('Please enter your PIN code to start the shift.');
      return;
    }
    const amount = parseFloatAmount(floatInput);
    if (!Number.isFinite(amount)) {
      setFormError('Please enter a valid starting cash amount.');
      return;
    }
    startShift(cashier, amount);
    router.replace('/floor-plan');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F2F2F2] py-8">
      <div className="w-[690px] max-w-full rounded-[30px] bg-white px-[56px] pb-[76px] pt-[40px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="relative h-[54px] w-[184px]">
            <Image src="/images/logo-69e842.png" alt="Restaurant logo" fill priority sizes="184px" className="object-contain" />
          </div>
        </div>

        {/* Title */}
        <div className="mt-[25px] flex flex-col items-center gap-[14px] text-center">
          <h1 className="text-[31px] font-semibold leading-[1.4] text-black">Start Shift</h1>
          <p className="text-[19px] font-normal leading-[1.4] text-[#989898]">Ready for a great day</p>
        </div>

        {/* Form */}
        <div className="mt-[66px] flex flex-col gap-[31px]">
          <div className="flex flex-col gap-[8px]">
            <label htmlFor="cashier-name" className="text-[15px] font-medium leading-[1.4] text-[#686868]">
              Cashier Name
            </label>
            <div className="relative">
              <select
                id="cashier-name"
                value={cashier}
                onChange={(e) => setCashier(e.target.value)}
                className="h-[53px] w-full appearance-none rounded-[87px] bg-[#F2F2F2] py-[16px] pl-[16px] pr-[52px] font-satoshi text-[16px] font-medium leading-[1.4] text-[#2D2F33] outline-none focus:ring-2 focus:ring-[#026F4F]"
              >
                {CASHIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown size={24} className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2 text-[#989898]" />
            </div>
          </div>

          <div className="flex flex-col gap-[8px]">
            <label htmlFor="pin-code" className="text-[15px] font-medium leading-[1.4] text-[#686868]">
              Pin Code
            </label>
            <input
              id="pin-code"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="********"
              className="h-[53px] w-full rounded-[87px] bg-[#F2F2F2] p-[16px] font-satoshi text-[16px] font-medium leading-[1.4] text-[#2D2F33] outline-none placeholder:text-[#989898] focus:ring-2 focus:ring-[#026F4F]"
            />
          </div>

          <div className="flex flex-col gap-[8px]">
            <label htmlFor="starting-float" className="text-[15px] font-medium leading-[1.4] text-[#686868]">
              Enter Starting Cash (Float)
            </label>
            <input
              id="starting-float"
              type="text"
              inputMode="decimal"
              value={floatInput}
              onChange={(e) => setFloatInput(e.target.value)}
              placeholder="$50.00"
              className="h-[53px] w-full rounded-[87px] bg-[#F2F2F2] p-[16px] font-satoshi text-[16px] font-medium leading-[1.4] text-[#2D2F33] outline-none placeholder:text-[#989898] focus:ring-2 focus:ring-[#026F4F]"
            />
          </div>
        </div>

        {formError && <p className="mt-4 text-center text-sm font-medium text-red-600">{formError}</p>}

        {/* Submit */}
        <button
          onClick={handleStartShift}
          className="mt-[60px] flex h-[59px] w-full items-center justify-center rounded-[30px] bg-[#026F4F] text-[19px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#015c42] active:scale-[0.99]"
        >
          Start Shift
        </button>
      </div>
    </div>
  );
}
