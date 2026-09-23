'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingKey =
  | 'cashPayments'
  | 'cardPayments'
  | 'walletPayments'
  | 'autoPrintReceipt'
  | 'autoPrintKOT'
  | 'enableInventoryTracking'
  | 'autoHideUnavailable'
  | 'lowStockAlerts'
  | 'requireOpeningFloat'
  | 'requireCountedCash'
  | 'orderAlerts'
  | 'lowStockNotif';

const DEFAULTS: Record<SettingKey, boolean> = {
  cashPayments: true,
  cardPayments: true,
  walletPayments: true,
  autoPrintReceipt: true,
  autoPrintKOT: true,
  enableInventoryTracking: true,
  autoHideUnavailable: true,
  lowStockAlerts: true,
  requireOpeningFloat: true,
  requireCountedCash: true,
  orderAlerts: true,
  lowStockNotif: true,
};

const LANGUAGES = ['English (US)', 'Arabic (SA)', 'Urdu (PK)', 'Hindi (IN)'];

// ─── iOS-style toggle (Figma 49x24, bright green on) ─────────────────────────
function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative h-[24px] w-[49px] shrink-0 rounded-full transition-colors',
        on ? 'bg-[#22C55E]' : 'bg-[#E9E9E9]',
      )}
    >
      <span
        className={cn(
          'absolute top-[2px] h-[20px] w-[20px] rounded-full bg-white shadow transition-all',
          on ? 'left-[27px]' : 'left-[2px]',
        )}
      />
    </button>
  );
}

function SettingRow({ label, settingKey, values, onToggle }: { label: string; settingKey: SettingKey; values: Record<SettingKey, boolean>; onToggle: (k: SettingKey) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[16px] font-normal leading-[1.4] text-black">{label}</span>
      <Toggle on={values[settingKey]} onChange={() => onToggle(settingKey)} label={label} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-[26px] rounded-[10px] bg-white p-[25px]">
      <h2 className="text-[19px] font-medium leading-[1.4] text-black">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const [values, setValues] = useState<Record<SettingKey, boolean>>(DEFAULTS);
  const [language, setLanguage] = useState(LANGUAGES[0]);

  function toggle(key: SettingKey) {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="flex min-h-[calc(100vh-24px)] flex-col gap-[19px] bg-[#F2F2F2]">
      {/* Header */}
      <div className="flex flex-col gap-[7px]">
        <h1 className="text-[19px] font-medium leading-[1.4] text-black">Settings</h1>
        <p className="text-[13px] font-normal leading-[1.4] text-[#989898]">Manage system preferences and configurations</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-[18px] pb-20 lg:grid-cols-2">
        <Card title="Payment Settings">
          <SettingRow label="Cash Payments" settingKey="cashPayments" values={values} onToggle={toggle} />
          <SettingRow label="Card Payments" settingKey="cardPayments" values={values} onToggle={toggle} />
          <SettingRow label="Wallet Payments" settingKey="walletPayments" values={values} onToggle={toggle} />
        </Card>

        <Card title="Printer Settings">
          <SettingRow label="Auto Print Receipt" settingKey="autoPrintReceipt" values={values} onToggle={toggle} />
          <SettingRow label="Auto Print KOT" settingKey="autoPrintKOT" values={values} onToggle={toggle} />
          <button
            onClick={() => alert('Test page sent to printer!')}
            className="flex h-[36px] w-full items-center justify-center rounded-[10px] bg-[#F2F2F2] text-[13px] font-medium leading-[1.4] text-black transition-colors hover:bg-[#E9E9E9]"
          >
            Test Print
          </button>
        </Card>

        <Card title="Inventory Settings">
          <SettingRow label="Enable Inventory Tracking" settingKey="enableInventoryTracking" values={values} onToggle={toggle} />
          <SettingRow label="Auto Hid unavailable items" settingKey="autoHideUnavailable" values={values} onToggle={toggle} />
          <SettingRow label="Low Stock alerts" settingKey="lowStockAlerts" values={values} onToggle={toggle} />
        </Card>

        <Card title="Session Settings">
          <SettingRow label="Require opening Cash float" settingKey="requireOpeningFloat" values={values} onToggle={toggle} />
          <SettingRow label="Require Counted cash on close" settingKey="requireCountedCash" values={values} onToggle={toggle} />
        </Card>

        <Card title="Notifications">
          <SettingRow label="Order Alerts" settingKey="orderAlerts" values={values} onToggle={toggle} />
          <SettingRow label="Low Stock Alerts" settingKey="lowStockNotif" values={values} onToggle={toggle} />
        </Card>

        <section className="flex min-w-0 flex-col gap-[18px] rounded-[10px] bg-white p-[25px]">
          <h2 className="text-[19px] font-medium leading-[1.4] text-black">Language & Regional Settings</h2>
          <div className="flex flex-col gap-[18px]">
            <span className="text-[16px] font-normal leading-[1.4] text-black">System Language</span>
            <div className="relative">
              <select
                aria-label="System language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="h-[43px] w-full appearance-none rounded-[7px] border border-[#989898] bg-white py-[11px] pl-[17px] pr-[40px] text-[14px] font-normal leading-[1.4] text-[#989898] outline-none focus:border-[#026F4F]"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <ChevronDown size={20} className="pointer-events-none absolute right-[17px] top-1/2 -translate-y-1/2 text-[#989898]" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
