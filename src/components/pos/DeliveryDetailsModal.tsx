'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { emptyDeliveryDetails, isDeliveryDetailsComplete, loadCustomerByPhone, saveCustomer, type DeliveryDetails } from '@/lib/delivery-details';

// Delivery address form for delivery-type orders. Only name / phone /
// address / street are required (Bug-12); landmark / floor / apartment /
// secondary phone are optional. Repeat callers are autofilled from the
// customer book by phone and can pick from saved addresses.

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
  const savedCustomer = loadCustomerByPhone(form.phone);

  const applyAddress = (idx: number) => {
    const addr = savedCustomer?.addresses[idx];
    if (!addr) return;
    setForm((prev) => ({
      ...prev,
      addressLabel: addr.label,
      address: addr.address,
      street: addr.street,
      landmark: addr.landmark,
      floor: addr.floor,
      apartment: addr.apartment,
      instructions: addr.instructions ?? prev.instructions,
    }));
  };

  const handlePhoneBlur = () => {
    const found = loadCustomerByPhone(form.phone);
    if (!found) return;
    setForm((prev) => {
      if (prev.name.trim() && prev.address.trim()) return prev;
      const first = found.addresses[0];
      return {
        ...prev,
        name: prev.name.trim() ? prev.name : found.name,
        secondaryPhone: prev.secondaryPhone?.trim() ? prev.secondaryPhone : (found.secondaryPhone ?? ''),
        addressLabel: first?.label ?? prev.addressLabel,
        address: prev.address.trim() ? prev.address : (first?.address ?? ''),
        street: prev.street.trim() ? prev.street : (first?.street ?? ''),
        landmark: prev.landmark.trim() ? prev.landmark : (first?.landmark ?? ''),
        floor: prev.floor.trim() ? prev.floor : (first?.floor ?? ''),
        apartment: prev.apartment.trim() ? prev.apartment : (first?.apartment ?? ''),
      };
    });
  };

  const handleSave = () => {
    if (!valid) return;
    saveCustomer(form);
    onSave(form);
  };

  const fields: { key: keyof DeliveryDetails; label: string; placeholder: string; required: boolean; inputMode?: 'tel' | 'text' }[] = [
    { key: 'name', label: t('name'), placeholder: t('namePlaceholder'), required: true },
    { key: 'phone', label: t('phone'), placeholder: t('phonePlaceholder'), required: true, inputMode: 'tel' },
    { key: 'secondaryPhone', label: 'Secondary Number', placeholder: '+20 1XXX XXX XXX', required: false, inputMode: 'tel' },
    { key: 'addressLabel', label: 'Address Label', placeholder: 'Home / Work / Other', required: false },
    { key: 'address', label: t('address'), placeholder: t('addressPlaceholder'), required: true },
    { key: 'street', label: t('street'), placeholder: t('streetPlaceholder'), required: true },
    { key: 'landmark', label: t('landmark'), placeholder: t('landmarkPlaceholder'), required: false },
    { key: 'floor', label: t('floor'), placeholder: t('floorPlaceholder'), required: false },
    { key: 'apartment', label: t('apartment'), placeholder: t('apartmentPlaceholder'), required: false },
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
          {savedCustomer && savedCustomer.addresses.length > 1 && (
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              {savedCustomer.addresses.map((a, i) => (
                <button
                  key={`${a.label}-${i}`}
                  type="button"
                  onClick={() => applyAddress(i)}
                  className="rounded-full bg-[#026F4F]/10 px-4 py-1.5 text-[12px] font-medium text-[#026F4F] transition-colors hover:bg-[#026F4F] hover:text-white"
                >
                  {a.label || `Address ${i + 1}`}
                </button>
              ))}
            </div>
          )}
          {fields.map((f) => (
            <div key={f.key} className={cn('flex flex-col gap-1.5', (f.key === 'name' || f.key === 'phone') && 'sm:col-span-1')}>
              <label className="text-[12px] font-medium leading-[1.4] text-[#686868]">
                {f.label}{' '}
                {f.required ? (
                  <span className="text-[#E85E5E]">*</span>
                ) : (
                  <span className="font-normal text-[#989898]">(optional)</span>
                )}
              </label>
              <input
                value={form[f.key] ?? ''}
                onChange={(e) => set(f.key)(e.target.value)}
                onBlur={f.key === 'phone' ? handlePhoneBlur : undefined}
                inputMode={f.inputMode ?? 'text'}
                dir={f.key === 'phone' || f.key === 'secondaryPhone' ? 'ltr' : undefined}
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
            onClick={handleSave}
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
