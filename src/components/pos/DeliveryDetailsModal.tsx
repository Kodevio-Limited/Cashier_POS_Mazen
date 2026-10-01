'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { emptyDeliveryDetails, isDeliveryDetailsComplete, type DeliveryDetails } from '@/lib/delivery-details';

// Delivery address form for delivery-type orders (Bug-57). All fields
// required except the specific instructions.
export function DeliveryDetailsModal({
  initial,
  onClose,
  onSave,
}: {
  initial: DeliveryDetails | null;
  onClose: () => void;
  onSave: (d: DeliveryDetails) => void;
}) {
  const t = useTranslations('order.delivery');
  const tc = useTranslations('order.customize');
  const tCommon = useTranslations('common.actions');
  const [form, setForm] = useState<DeliveryDetails>(initial ?? emptyDeliveryDetails());

  const set = (key: keyof DeliveryDetails) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const valid = isDeliveryDetailsComplete(form);

  const fields: { key: keyof DeliveryDetails; label: string; placeholder: string; inputMode?: 'tel' | 'text' }[] = [
    { key: 'name', label: t('name'), placeholder: t('namePlaceholder') },
    { key: 'phone', label: t('phone'), placeholder: t('phonePlaceholder'), inputMode: 'tel' },
    { key: 'address', label: t('address'), placeholder: t('addressPlaceholder') },
    { key: 'street', label: t('street'), placeholder: t('streetPlaceholder') },
    { key: 'landmark', label: t('landmark'), placeholder: t('landmarkPlaceholder') },
    { key: 'floor', label: t('floor'), placeholder: t('floorPlaceholder') },
    { key: 'apartment', label: t('apartment'), placeholder: t('apartmentPlaceholder') },
  ];

  return (
    <div className="pos-overlay z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="pos-overlay__panel w-[560px] max-w-full rounded-[17px] bg-white px-8 pb-8 pt-[26px] shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[23px] font-medium leading-[1.4] text-black">
            <MapPin size={22} className="shrink-0 text-[#026F4F]" />
            {t('title')}
          </h2>
          <button onClick={onClose} aria-label={t('title')} className="text-black transition-colors hover:text-zinc-500">
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        <div className="mt-[25px] grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={cn('flex flex-col gap-1.5', (f.key === 'name' || f.key === 'phone') && 'sm:col-span-1')}>
              <label className="text-[12px] font-medium leading-[1.4] text-[#686868]">
                {f.label} <span className="text-[#E85E5E]">*</span>
              </label>
              <input
                value={form[f.key] ?? ''}
                onChange={(e) => set(f.key)(e.target.value)}
                inputMode={f.inputMode ?? 'text'}
                dir={f.key === 'phone' ? 'ltr' : undefined}
                placeholder={f.placeholder}
                className="h-[41px] w-full rounded-[9px] bg-[#F2F2F2] px-[11px] font-satoshi text-[13px] font-medium leading-[1.4] text-[#2D2F33] outline-none placeholder:text-[#B9B9B9] focus:ring-2 focus:ring-[#026F4F]"
              />
            </div>
          ))}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-[12px] font-medium leading-[1.4] text-[#686868]">
              {t('instructions')} <span className="font-normal text-[#989898]">{t('optional')}</span>
            </label>
            <textarea
              value={form.instructions ?? ''}
              onChange={(e) => set('instructions')(e.target.value)}
              placeholder={t('instructionsPlaceholder')}
              rows={3}
              className="h-[74px] w-full resize-none rounded-[9px] bg-[#F2F2F2] p-[11px] font-satoshi text-[13px] font-medium leading-[1.4] text-[#2D2F33] outline-none placeholder:text-[#B9B9B9] focus:ring-2 focus:ring-[#026F4F]"
            />
          </div>
        </div>

        <div className="mt-[20px] flex items-center justify-between gap-[5px]">
          <button
            onClick={onClose}
            className="h-[44px] w-[185px] max-w-[48%] rounded-[20px] border border-[#B9B9B9] bg-[#E9E9E9] font-satoshi text-[13px] font-medium leading-[1.4] text-[#2D2F33] transition-colors hover:bg-[#E0E0E0]"
          >
            {tCommon('cancel')}
          </button>
          <button
            onClick={() => valid && onSave(form)}
            disabled={!valid}
            className={cn(
              'h-[44px] w-[185px] max-w-[48%] rounded-[20px] font-satoshi text-[13px] font-medium leading-[1.4] text-white shadow-[0px_2.7px_5.4px_rgba(0,0,0,0.12)] transition-colors',
              valid ? 'bg-[#026F4F] hover:bg-[#015c42]' : 'cursor-not-allowed bg-[#B9B9B9]',
            )}
          >
            {tc('done')}
          </button>
        </div>
      </div>
    </div>
  );
}
