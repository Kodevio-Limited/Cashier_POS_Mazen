'use client';

import { useState } from 'react';
import { Settings, Printer, Percent, Bell, Shield, Monitor, Save, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [terminalName, setTerminalName] = useState('Cashier Terminal #01');
  const [printerIp, setPrinterIp] = useState('192.168.1.150');
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [taxRate, setTaxRate] = useState('10');
  const [serviceCharge, setServiceCharge] = useState('10');
  const [savedSuccess, setSavedSuccess] = useState(false);

  function handleSaveSettings() {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  }

  return (
    <div className="flex h-[calc(100vh-24px)] flex-col gap-3 bg-[#F2F2F2] p-1.5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-3.5 bg-white rounded-xl border border-[#E9E9E9]">
        <div>
          <h1 className="text-black text-xl font-medium font-['Inter']">POS Terminal Settings</h1>
          <p className="text-neutral-400 text-xs font-normal font-['Inter'] font-sans">Configure hardware printers, receipt layout, tax rates, and alert preferences</p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-5 py-2 bg-[#026F4F] hover:bg-[#015c42] text-white rounded-full text-xs font-medium transition-all shadow-xs flex items-center gap-1.5"
        >
          {savedSuccess ? <Check size={16} /> : <Save size={16} />}
          <span>{savedSuccess ? 'Settings Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Settings Sections Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Terminal Configuration */}
        <div className="bg-white rounded-xl p-5 border border-[#E9E9E9] flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-200">
            <Monitor size={20} className="text-[#026F4F]" />
            <h3 className="font-semibold text-black text-base">Terminal & Hardware</h3>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500 font-medium">Terminal Register Name</label>
              <input
                type="text"
                value={terminalName}
                onChange={(e) => setTerminalName(e.target.value)}
                className="w-full h-10 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-black focus:outline-hidden focus:border-[#026F4F]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500 font-medium">Thermal Receipt Printer IP Address</label>
              <input
                type="text"
                value={printerIp}
                onChange={(e) => setPrinterIp(e.target.value)}
                className="w-full h-10 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-black focus:outline-hidden focus:border-[#026F4F]"
              />
            </div>
          </div>
        </div>

        {/* Taxes & Rates */}
        <div className="bg-white rounded-xl p-5 border border-[#E9E9E9] flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-200">
            <Percent size={20} className="text-[#026F4F]" />
            <h3 className="font-semibold text-black text-base">Taxes & Charges</h3>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500 font-medium">Sales Tax Rate (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full h-10 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-black focus:outline-hidden focus:border-[#026F4F]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-500 font-medium">Service Charge Rate (%)</label>
              <input
                type="number"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(e.target.value)}
                className="w-full h-10 px-3 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-black focus:outline-hidden focus:border-[#026F4F]"
              />
            </div>
          </div>
        </div>

        {/* Notifications & Toggles */}
        <div className="bg-white rounded-xl p-5 border border-[#E9E9E9] flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-200">
            <Bell size={20} className="text-[#026F4F]" />
            <h3 className="font-semibold text-black text-base">Receipts & Notifications</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-black">Auto-Print Receipt on Order Placement</p>
                <p className="text-[11px] text-neutral-400">Automatically trigger receipt printer after payment completion</p>
              </div>
              <input
                type="checkbox"
                checked={autoPrintReceipt}
                onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                className="w-4 h-4 accent-[#026F4F] cursor-pointer"
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-black">Audio Chime on New Table Request</p>
                <p className="text-[11px] text-neutral-400">Play sound alert when table requests waiter or bill</p>
              </div>
              <input
                type="checkbox"
                checked={soundAlerts}
                onChange={(e) => setSoundAlerts(e.target.checked)}
                className="w-4 h-4 accent-[#026F4F] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
