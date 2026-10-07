'use client';

// Shift Management — Figma node 1136:2090. Shows the live cashier session,
// cash-drawer tracking, live revenue and order statistics, and closes the
// active shift (ending the session and returning to Start Shift). Guarded:
// only reachable while a shift is active.

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { endShift, getActiveShift, subscribeShift, type ActiveShift } from '@/lib/shift-session';

export default function ShiftClosePage() {
  const router = useRouter();
  const [shift, setShift] = useState<ActiveShift | null>(null);

  // Guard: no active shift → back to Start Shift.
  useEffect(() => {
    const current = getActiveShift();
    if (!current) {
      router.replace('/shift');
      return;
    }
    setShift(current);
    return subscribeShift(() => {
      const next = getActiveShift();
      if (!next) router.replace('/shift');
      else setShift(next);
    });
  }, [router]);

  if (!shift) return null;

  return <ShiftDashboard shift={shift} />;
}

function StatCard({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex flex-col gap-[10px] rounded-[10px] bg-white px-[16px] py-[14px]">
      <span className="text-[11px] font-medium uppercase tracking-wide text-[#989898]">{label}</span>
      <span className={cn('text-[20px] font-semibold leading-[1.4] text-black', valueClass)}>{value}</span>
    </div>
  );
}

function StatNum({ value, color, label }: { value: string; color: string; label: string }) {
  return (
    <div className="flex flex-col gap-[10px]">
      <span className="text-[26px] font-semibold leading-[1.2]" style={{ color }}>
        {value}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide text-[#989898]">{label}</span>
    </div>
  );
}

/* ── Shift Management dashboard ─────────────────────────────────────────── */
function ShiftDashboard({ shift }: { shift: ActiveShift }) {
  const router = useRouter();
  const t = useTranslations('shiftClose');
  const { openingFloat, cashierName, startedAt } = shift;

  const startedLabel = new Date(startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Mock live figures (real values will come from the API).
  const cashSales = 480.5;
  const cardSales = 840.2;
  const walletSales = 450;
  const totalGross = cashSales + cardSales + walletSales;
  const netCash = openingFloat;
  const expectedCash = openingFloat + netCash;

  function handleClose() {
    if (confirm(t('confirmCloseDialog'))) {
      endShift();
      router.replace('/shift');
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-38px)] flex-col gap-[22px] pb-20">
      {/* Header */}
      <div className="flex max-w-[990px] flex-col gap-[7px]">
        <h1 className="text-[20px] font-medium leading-[1.4] text-black">{t('heading')}</h1>
        <p className="text-[13px] font-normal leading-[1.4] text-[#989898]">{t('manageSubtitle')}</p>
      </div>

      <div className="flex max-w-[990px] flex-col gap-[22px]">
        {/* Session info */}
        <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-3">
          <StatCard label={t('sessionId')} value="S-2012" />
          <StatCard label={t('cashierLabel')} value={cashierName} />
          <StatCard label={t('startedAtLabel')} value={startedLabel} />
        </div>

        {/* Case Drawer Tracking */}
        <div className="flex flex-col gap-[12px]">
          <h2 className="text-[15px] font-medium leading-[1.4] text-black">{t('caseDrawerTracking')}</h2>
          <div className="grid grid-cols-1 divide-y divide-white/20 rounded-[12px] bg-[#2D2F33] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="flex flex-col justify-center gap-[10px] px-[24px] py-[18px]">
              <span className="text-[11px] font-medium uppercase tracking-wide text-white/60">{t('openingFloatLabel')}</span>
              <span className="text-[22px] font-semibold leading-[1.3] text-white">${openingFloat.toFixed(2)}</span>
            </div>
            <div className="flex flex-col justify-center gap-[10px] px-[24px] py-[18px]">
              <span className="text-[11px] font-medium uppercase tracking-wide text-white/60">{t('netCashCollected')}</span>
              <span className="text-[22px] font-semibold leading-[1.3] text-[#4ADE80]">+${netCash.toFixed(2)}</span>
            </div>
            <div className="flex flex-col justify-center gap-[10px] px-[24px] py-[18px]">
              <span className="text-[11px] font-medium uppercase tracking-wide text-white/60">{t('expectedCashInDrawer')}</span>
              <span className="text-[22px] font-semibold leading-[1.3] text-white">${expectedCash.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Live Revenue Tracking */}
        <div className="flex flex-col gap-[12px]">
          <h2 className="text-[15px] font-medium leading-[1.4] text-black">{t('liveRevenueTracking')}</h2>
          <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t('cashSalesLabel')} value={`$${cashSales.toFixed(2)}`} />
            <StatCard label={t('cardPaymentsLabel')} value={`$${cardSales.toFixed(2)}`} />
            <StatCard label={t('walletPayments')} value={`$${walletSales.toFixed(2)}`} />
            <div className="flex flex-col gap-[10px] rounded-[10px] bg-[#026F4F] px-[16px] py-[14px]">
              <span className="text-[11px] font-medium uppercase tracking-wide text-white/70">{t('totalGrossSales')}</span>
              <span className="text-[20px] font-semibold leading-[1.4] text-white">${totalGross.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Order Statistics + End of Shift */}
        <div className="grid grid-cols-1 gap-[16px] lg:grid-cols-[1.7fr_1fr]">
          <div className="flex flex-col justify-between gap-[24px] rounded-[12px] bg-white p-[20px]">
            <h2 className="text-[16px] font-medium leading-[1.4] text-black">{t('orderStatistics')}</h2>
            <div className="grid grid-cols-2 gap-[16px] sm:grid-cols-4">
              <StatNum value="42" color="#2563EB" label={t('statTotalOrders')} />
              <StatNum value="39" color="#16A34A" label={t('statCompleted')} />
              <StatNum value="2" color="#EA580C" label={`${t('statRefunds')} ($12.50)`} />
              <StatNum value="1" color="#DC2626" label={t('statCancelled')} />
            </div>
            <div className="flex flex-wrap gap-[12px]">
              <button
                onClick={() => router.push('/running-order')}
                className="h-[46px] flex-1 rounded-full bg-[#F2F2F2] text-[14px] font-medium text-[#2D2F33] transition-colors hover:bg-[#E9E9E9]"
              >
                {t('viewSessionOrders')}
              </button>
              <button
                onClick={() => alert(t('interimReportAlert'))}
                className="h-[46px] flex-1 rounded-full bg-[#F2F2F2] text-[14px] font-medium text-[#2D2F33] transition-colors hover:bg-[#E9E9E9]"
              >
                {t('printInterimReport')}
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-[16px] rounded-[12px] bg-[#F8CACA] p-[20px]">
            <div className="flex flex-col gap-[12px]">
              <h2 className="text-[16px] font-medium leading-[1.4] text-[#B91C1C]">{t('endOfShift')}</h2>
              <p className="text-[13px] font-normal leading-[1.6] text-[#7F1D1D]">{t('endOfShiftBody')}</p>
            </div>
            <button
              onClick={handleClose}
              className="h-[46px] w-full rounded-full bg-[#DC2626] text-[15px] font-medium text-white transition-colors hover:bg-[#b91c1c]"
            >
              {t('closeSession')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
