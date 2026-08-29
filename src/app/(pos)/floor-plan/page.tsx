'use client';

import { useState } from 'react';
import { Users, Clock, Plus, Filter, Check, ArrowRightLeft, CreditCard, Receipt, AlertCircle, Sparkles, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type TableStatus = 'Available' | 'Occupied' | 'Reserved' | 'Billed';
type Zone = 'Main Dining' | 'Terrace / Patio' | 'Bar Area' | 'VIP Room';

interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  zone: Zone;
  guestsCount?: number;
  orderId?: string;
  orderTotal?: number;
  timeSeated?: string;
  reservedTime?: string;
  reservedName?: string;
  shape: 'square' | 'round' | 'rectangle';
}

const INITIAL_TABLES: Table[] = [
  { id: 't1', name: 'Table 01', capacity: 2, status: 'Available', zone: 'Main Dining', shape: 'square' },
  { id: 't2', name: 'Table 02', capacity: 4, status: 'Available', zone: 'Main Dining', shape: 'square' },
  { id: 't3', name: 'Table 03', capacity: 4, status: 'Occupied', zone: 'Main Dining', guestsCount: 3, orderId: '#044', orderTotal: 59.34, timeSeated: '45 mins', shape: 'rectangle' },
  { id: 't4', name: 'Table 04', capacity: 6, status: 'Available', zone: 'Main Dining', shape: 'rectangle' },
  { id: 't5', name: 'Table 05', capacity: 2, status: 'Reserved', zone: 'Main Dining', reservedTime: '7:30 PM', reservedName: 'John Smith', shape: 'round' },
  { id: 't6', name: 'Table 06', capacity: 4, status: 'Occupied', zone: 'Main Dining', guestsCount: 4, orderId: '#045', orderTotal: 30.22, timeSeated: '20 mins', shape: 'square' },
  { id: 't7', name: 'Table 07', capacity: 2, status: 'Billed', zone: 'Main Dining', guestsCount: 2, orderId: '#048', orderTotal: 45.50, timeSeated: '1 hr 10 mins', shape: 'round' },
  { id: 't8', name: 'Table 08', capacity: 8, status: 'Available', zone: 'Main Dining', shape: 'rectangle' },

  // Terrace
  { id: 't9', name: 'Patio 01', capacity: 4, status: 'Available', zone: 'Terrace / Patio', shape: 'round' },
  { id: 't10', name: 'Patio 02', capacity: 4, status: 'Occupied', zone: 'Terrace / Patio', guestsCount: 4, orderId: '#051', orderTotal: 82.10, timeSeated: '35 mins', shape: 'round' },

  // Bar
  { id: 't11', name: 'Bar Seat 01', capacity: 1, status: 'Available', zone: 'Bar Area', shape: 'square' },
  { id: 't12', name: 'Bar Seat 02', capacity: 1, status: 'Occupied', zone: 'Bar Area', guestsCount: 1, orderId: '#053', orderTotal: 15.99, timeSeated: '10 mins', shape: 'square' },

  // VIP
  { id: 't13', name: 'VIP Suite 01', capacity: 12, status: 'Reserved', zone: 'VIP Room', reservedTime: '8:00 PM', reservedName: 'CEO Dinner Group', shape: 'rectangle' },
];

export default function FloorPlanPage() {
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [selectedZone, setSelectedZone] = useState<Zone>('Main Dining');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | TableStatus>('All');
  const [activeModalTable, setActiveModalTable] = useState<Table | null>(null);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [targetTransferTable, setTargetTransferTable] = useState<string>('');

  const filteredTables = tables.filter((t) => {
    const matchesZone = t.zone === selectedZone;
    const matchesStatus = selectedStatusFilter === 'All' || t.status === selectedStatusFilter;
    return matchesZone && matchesStatus;
  });

  // Summary Counters
  const totalTables = tables.filter((t) => t.zone === selectedZone).length;
  const occupiedCount = tables.filter((t) => t.zone === selectedZone && t.status === 'Occupied').length;
  const availableCount = tables.filter((t) => t.zone === selectedZone && t.status === 'Available').length;
  const reservedCount = tables.filter((t) => t.zone === selectedZone && t.status === 'Reserved').length;
  const billedCount = tables.filter((t) => t.zone === selectedZone && t.status === 'Billed').length;

  function handleTransferTable() {
    if (!activeModalTable || !targetTransferTable) return;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === activeModalTable.id) {
          return { ...t, status: 'Available', guestsCount: undefined, orderId: undefined, orderTotal: undefined, timeSeated: undefined };
        }
        if (t.id === targetTransferTable) {
          return {
            ...t,
            status: 'Occupied',
            guestsCount: activeModalTable.guestsCount,
            orderId: activeModalTable.orderId,
            orderTotal: activeModalTable.orderTotal,
            timeSeated: activeModalTable.timeSeated,
          };
        }
        return t;
      }),
    );
    setShowTransferModal(false);
    setActiveModalTable(null);
    alert(`Successfully transferred ${activeModalTable.name} to target table.`);
  }

  return (
    <div className="flex h-[calc(100vh-24px)] flex-col gap-3 bg-[#F2F2F2] p-1.5 rounded-2xl overflow-hidden">
      {/* Top Header */}
      <div className="flex justify-between items-center px-5 py-3.5 bg-white rounded-xl border border-[#E9E9E9]">
        <div>
          <h1 className="text-black text-xl font-medium font-['Inter']">Floor Plan & Table Layout</h1>
          <p className="text-neutral-400 text-xs font-normal font-['Inter']">Real-time table seating management & order assignments</p>
        </div>

        {/* Zone Selector Pills */}
        <div className="flex items-center gap-2">
          {(['Main Dining', 'Terrace / Patio', 'Bar Area', 'VIP Room'] as const).map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium font-['Inter'] transition-all",
                selectedZone === zone
                  ? 'bg-[#026F4F] text-white shadow-xs'
                  : 'bg-[#F2F2F2] text-stone-500 hover:bg-zinc-200',
              )}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards Bar */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-3 border border-[#E9E9E9] flex items-center justify-between">
          <div>
            <p className="text-neutral-400 text-xs font-normal">Total Tables</p>
            <p className="text-black text-lg font-bold">{totalTables}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700">
            <Users size={18} />
          </div>
        </div>

        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'Available' ? 'All' : 'Available')}
          className={cn(
            'bg-white rounded-xl p-3 border flex items-center justify-between text-left transition-all',
            selectedStatusFilter === 'Available' ? 'border-[#026F4F] ring-2 ring-[#026F4F]/20' : 'border-[#E9E9E9]',
          )}
        >
          <div>
            <p className="text-emerald-700 text-xs font-medium">Available</p>
            <p className="text-black text-lg font-bold">{availableCount}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-[#026F4F]">
            <Check size={18} />
          </div>
        </button>

        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'Occupied' ? 'All' : 'Occupied')}
          className={cn(
            'bg-white rounded-xl p-3 border flex items-center justify-between text-left transition-all',
            selectedStatusFilter === 'Occupied' ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-[#E9E9E9]',
          )}
        >
          <div>
            <p className="text-orange-600 text-xs font-medium">Occupied</p>
            <p className="text-black text-lg font-bold">{occupiedCount}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <Users size={18} />
          </div>
        </button>

        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'Billed' ? 'All' : 'Billed')}
          className={cn(
            'bg-white rounded-xl p-3 border flex items-center justify-between text-left transition-all',
            selectedStatusFilter === 'Billed' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-[#E9E9E9]',
          )}
        >
          <div>
            <p className="text-amber-600 text-xs font-medium">Check Requested</p>
            <p className="text-black text-lg font-bold">{billedCount}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <Receipt size={18} />
          </div>
        </button>

        <button
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'Reserved' ? 'All' : 'Reserved')}
          className={cn(
            'bg-white rounded-xl p-3 border flex items-center justify-between text-left transition-all',
            selectedStatusFilter === 'Reserved' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-[#E9E9E9]',
          )}
        >
          <div>
            <p className="text-blue-600 text-xs font-medium">Reserved</p>
            <p className="text-black text-lg font-bold">{reservedCount}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Clock size={18} />
          </div>
        </button>
      </div>

      {/* Main Interactive Grid Workspace */}
      <div className="flex-1 bg-white rounded-xl p-6 overflow-y-auto border border-[#E9E9E9]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              onClick={() => setActiveModalTable(table)}
              className={cn(
                'min-h-[170px] bg-white rounded-2xl border p-4 flex flex-col justify-between cursor-pointer transition-all hover:shadow-lg relative overflow-hidden group',
                table.status === 'Available' && 'border-emerald-300 hover:border-emerald-600 bg-emerald-50/20',
                table.status === 'Occupied' && 'border-orange-300 hover:border-orange-600 bg-orange-50/20',
                table.status === 'Billed' && 'border-amber-300 hover:border-amber-600 bg-amber-50/20',
                table.status === 'Reserved' && 'border-blue-300 hover:border-blue-600 bg-blue-50/20',
              )}
            >
              {/* Status Header Badge */}
              <div className="flex justify-between items-center">
                <span className="text-black text-lg font-bold font-['Inter']">{table.name}</span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider',
                    table.status === 'Available' && 'bg-emerald-100 text-emerald-800',
                    table.status === 'Occupied' && 'bg-orange-100 text-orange-800',
                    table.status === 'Billed' && 'bg-amber-100 text-amber-800',
                    table.status === 'Reserved' && 'bg-blue-100 text-blue-800',
                  )}
                >
                  {table.status}
                </span>
              </div>

              {/* Table Details Body */}
              <div className="flex flex-col gap-1.5 my-2">
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <Users size={14} />
                  <span>Capacity: {table.capacity} Seats</span>
                </div>

                {table.status === 'Occupied' && (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium">
                      <span>Order: {table.orderId}</span>
                      <span className="text-emerald-700 font-bold">${table.orderTotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                      <Clock size={13} />
                      <span>Seated: {table.timeSeated}</span>
                    </div>
                  </>
                )}

                {table.status === 'Billed' && (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium">
                      <span>Bill Total:</span>
                      <span className="font-bold">${table.orderTotal?.toFixed(2)}</span>
                    </div>
                    <p className="text-[11px] text-amber-700">Check Requested</p>
                  </>
                )}

                {table.status === 'Reserved' && (
                  <div className="text-xs text-blue-800">
                    <p className="font-medium">{table.reservedName}</p>
                    <p className="text-[11px] text-blue-600">Reserved for {table.reservedTime}</p>
                  </div>
                )}
              </div>

              {/* Action Link Footer */}
              <div className="flex justify-between items-center pt-2 border-t border-dashed border-zinc-200 text-xs">
                <span className="text-neutral-400 text-[11px]">Click to manage</span>
                <ChevronRight size={14} className="text-[#026F4F] group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Table Action Modal ──────────────────────────────────────────────── */}
      {activeModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="w-[420px] bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <div>
                <h3 className="text-black text-xl font-bold font-['Inter']">{activeModalTable.name}</h3>
                <p className="text-xs text-neutral-400">{activeModalTable.zone} • {activeModalTable.capacity} Seats</p>
              </div>
              <button
                onClick={() => setActiveModalTable(null)}
                className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Table State Summary */}
            <div className="bg-zinc-100 rounded-xl p-3.5 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500">Status</span>
                <span className="font-bold text-black uppercase">{activeModalTable.status}</span>
              </div>
              {activeModalTable.orderId && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">Active Order</span>
                  <span className="font-semibold text-emerald-700">{activeModalTable.orderId} (${activeModalTable.orderTotal?.toFixed(2)})</span>
                </div>
              )}
            </div>

            {/* Modal Actions depending on Table Status */}
            <div className="flex flex-col gap-2 pt-2">
              {activeModalTable.status === 'Available' && (
                <button
                  onClick={() => {
                    setTables((prev) =>
                      prev.map((t) => (t.id === activeModalTable.id ? { ...t, status: 'Occupied', guestsCount: 2, orderId: '#NEW', orderTotal: 0 } : t)),
                    );
                    setActiveModalTable(null);
                  }}
                  className="w-full h-11 bg-[#026F4F] hover:bg-[#015c42] text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  <span>Start New Order & Seat Guests</span>
                </button>
              )}

              {activeModalTable.status === 'Occupied' && (
                <>
                  <button
                    onClick={() => {
                      window.location.href = '/order';
                    }}
                    className="w-full h-11 bg-[#026F4F] hover:bg-[#015c42] text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    <span>Add Items to Order</span>
                  </button>

                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="w-full h-11 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowRightLeft size={16} />
                    <span>Transfer Table</span>
                  </button>

                  <button
                    onClick={() => {
                      setTables((prev) =>
                        prev.map((t) => (t.id === activeModalTable.id ? { ...t, status: 'Billed' } : t)),
                      );
                      setActiveModalTable(null);
                    }}
                    className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Receipt size={16} />
                    <span>Print Bill / Request Check</span>
                  </button>
                </>
              )}

              {activeModalTable.status === 'Billed' && (
                <button
                  onClick={() => {
                    setTables((prev) =>
                      prev.map((t) => (t.id === activeModalTable.id ? { ...t, status: 'Available', orderId: undefined, orderTotal: undefined } : t)),
                    );
                    setActiveModalTable(null);
                    alert(`Payment completed for ${activeModalTable.name}. Table is now Available!`);
                  }}
                  className="w-full h-11 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  <span>Collect Payment & Clear Table</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transfer Table Sub-Modal */}
      {showTransferModal && activeModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="w-[380px] bg-white rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <h4 className="font-bold text-lg text-black">Transfer {activeModalTable.name}</h4>
            <p className="text-xs text-neutral-400">Select an available target table to transfer active order {activeModalTable.orderId}</p>

            <select
              value={targetTransferTable}
              onChange={(e) => setTargetTransferTable(e.target.value)}
              className="w-full h-11 border border-zinc-300 rounded-xl px-3 text-sm text-black"
            >
              <option value="">Select Target Table</option>
              {tables
                .filter((t) => t.status === 'Available')
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.zone} - {t.capacity} seats)
                  </option>
                ))}
            </select>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 h-10 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferTable}
                className="flex-1 h-10 bg-[#026F4F] hover:bg-[#015c42] text-white rounded-xl font-medium text-xs"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
