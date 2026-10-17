'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '@/lib/use-body-scroll-lock';

/**
 * PIN verification gate for sensitive actions (waste logging, refunds).
 * Mock backend: any non-empty PIN is accepted, matching the Start Shift screen.
 */
export function PinVerifyModal({
  title,
  onVerify,
  onCancel,
}: {
  title?: string;
  onVerify: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('pinVerify');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useBodyScrollLock(true);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function confirm() {
    if (!pin.trim()) {
      setError(t('required'));
      return;
    }
    onVerify();
  }

  return (
    <div className="pos-overlay z-[90] flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="pos-overlay__panel w-[360px] max-w-full rounded-[17px] bg-white px-[32px] pb-[26px] pt-[26px] shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[23px] font-medium leading-[1.4] text-black">{title ?? t('title')}</h2>
          <button onClick={onCancel} aria-label={t('close')} className="text-black transition-colors hover:text-zinc-500">
            <X size={24} />
          </button>
        </div>
        <p className="mt-[7px] text-[15px] font-normal leading-[1.4] text-[#989898]">{t('subtitle')}</p>

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirm();
          }}
          placeholder={t('placeholder')}
          className="mt-[22px] h-[52px] w-full rounded-[30px] bg-[#F2F2F2] p-[16px] text-center font-satoshi text-[19px] font-medium tracking-[0.3em] text-[#2D2F33] outline-none placeholder:tracking-normal placeholder:text-[#989898] focus:ring-2 focus:ring-[#026F4F]"
        />
        {error && <p className="mt-2 text-center text-[13px] font-medium text-red-600">{error}</p>}

        <div className="mt-[24px] flex flex-col justify-between gap-[19px] sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="h-[52px] w-full rounded-[30px] border border-[#B9B9B9] bg-[#E9E9E9] font-satoshi text-[19px] font-medium leading-[1.4] text-[#2D2F33] transition-colors hover:bg-[#E0E0E0] sm:w-[140px]"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={confirm}
            className="h-[52px] w-full rounded-[30px] bg-[#026F4F] font-satoshi text-[19px] font-medium leading-[1.4] text-white shadow-[0px_4px_16.3px_11px_rgba(0,0,0,0.12)] transition-all hover:bg-[#015c42] active:scale-[0.99] sm:w-[140px]"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
