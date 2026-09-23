'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowRightLeft, Receipt, CreditCard, X, ShoppingBag, Bike } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FloorTableCard, type FloorTableStatus } from '@/components/pos/FloorTableCard';

type Zone = 'Indoor' | 'Outdoor' | 'Patio';

interface FloorTable {
  id: string;
  name: string;
  capacity: number;
  status: FloorTableStatus;
  zone: Zone;
  guestsCount?: number;
  itemsCount?: number;
  orderId?: string;
  orderTotal?: number;
  timeSeated?: string;
  reservedTime?: string;
  reservedName?: string;
}

const INITIAL_TABLES: FloorTable[] = [
  { id: 't1', name: 'Table A01', capacity: 2, status: 'available', zone: 'Indoor' },
  { id: 't2', name: 'Table A02', capacity: 4, status: 'occupied', zone: 'Indoor', guestsCount: 3, itemsCount: 4, orderId: '#044', orderTotal: 15.99, timeSeated: '35 mins' },
  { id: 't3', name: 'Table A03', capacity: 4, status: 'available', zone: 'Indoor' },
  { id: 't4', name: 'Table A04', capacity: 2, status: 'reserved', zone: 'Indoor', reservedTime: '7:30 PM', reservedName: 'John Smith' },
  { id: 't5', name: 'Table A05', capacity: 6, status: 'occupied', zone: 'Indoor', guestsCount: 4, itemsCount: 2, orderId: '#045', orderTotal: 42.5, timeSeated: '20 mins' },
  { id: 't6', name: 'Table A06', capacity: 4, status: 'available', zone: 'Indoor' },
  { id: 't7', name: 'Table A07', capacity: 2, status: 'occupied', zone: 'Indoor', guestsCount: 2, itemsCount: 3, orderId: '#048', orderTotal: 28.75, timeSeated: '50 mins' },
  { id: 't8', name: 'Table A08', capacity: 8, status: 'available', zone: 'Indoor' },
  { id: 't9', name: 'Table B01', capacity: 4, status: 'available', zone: 'Outdoor' },
  { id: 't10', name: 'Table B02', capacity: 4, status: 'occupied', zone: 'Outdoor', guestsCount: 4, itemsCount: 5, orderId: '#051', orderTotal: 82.1, timeSeated: '15 mins' },
  { id: 't11', name: 'Table B03', capacity: 6, status: 'reserved', zone: 'Outdoor', reservedTime: '8:00 PM', reservedName: 'Sarah Lee' },
  { id: 't12', name: 'Table C01', capacity: 4, status: 'occupied', zone: 'Patio', guestsCount: 3, itemsCount: 2, orderId: '#053', orderTotal: 33.98, timeSeated: '10 mins' },
  { id: 't13', name: 'Table C02', capacity: 2, status: 'available', zone: 'Patio' },
];

const ZONE_FILTERS = ['All', 'Indoor', 'Outdoor', 'Patio'] as const;
type ZoneFilter = (typeof ZONE_FILTERS)[number];

export default function FloorPlanPage() {
  const router = useRouter();
  const [tables, setTables] = useState<FloorTable[]>(INITIAL_TABLES);
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('All');
  const [activeModalTable, setActiveModalTable] = useState<FloorTable | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetTransferTable, setTargetTransferTable] = useState('');

  const filteredTables = useMemo(
    () => tables.filter((t) => zoneFilter === 'All' || t.zone === zoneFilter),
    [tables, zoneFilter],
  );

  function seatTable(table: FloorTable) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === table.id
          ? { ...t, status: 'occupied' as FloorTableStatus, guestsCount: 2, itemsCount: 0, orderId: '#NEW', orderTotal: 0, timeSeated: 'Just now', reservedName: undefined, reservedTime: undefined }
          : t,
      ),
    );
    setActiveModalTable(null);
  }

  function clearTable(table: FloorTable) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === table.id
          ? { ...t, status: 'available' as FloorTableStatus, guestsCount: undefined, itemsCount: undefined, orderId: undefined, orderTotal: undefined, timeSeated: undefined }
          : t,
      ),
    );
    setActiveModalTable(null);
  }

  function handleTransferTable() {
    if (!activeModalTable || !targetTransferTable) return;
    const source = activeModalTable;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === source.id) {
          return { ...t, status: 'available' as FloorTableStatus, guestsCount: undefined, itemsCount: undefined, orderId: undefined, orderTotal: undefined, timeSeated: undefined };
        }
        if (t.id === targetTransferTable) {
          return {
            ...t,
            status: 'occupied' as FloorTableStatus,
            guestsCount: source.guestsCount,
            itemsCount: source.itemsCount,
            orderId: source.orderId,
            orderTotal: source.orderTotal,
            timeSeated: source.timeSeated,
            reservedName: undefined,
            reservedTime: undefined,
          };
        }
        return t;
      }),
    );
    setShowTransferModal(false);
    setActiveModalTable(null);
    setTargetTransferTable('');
  }

  return (
    <div className="flex min-h-[calc(100vh-24px)] flex-col bg-[#F2F2F2]">
      {/* ── Header (Figma 1843:341) ─────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-[19px]">
          <h1 className="text-[19px] font-medium leading-[1.4] text-black">
            Floor Plan <span className="text-[13px] font-normal text-[#989898]">({tables.length} tables)</span>
          </h1>
          <div className="flex flex-wrap items-center gap-[13px]">
            {ZONE_FILTERS.map((zone) => (
              <button
                key={zone}
                onClick={() => setZoneFilter(zone)}
                className={cn(
                  'flex h-[33px] items-center justify-center rounded-[32.5px] px-4 text-[13px] font-normal leading-[1.4] transition-all',
                  zoneFilter === zone
                    ? 'bg-[#026F4F] text-white shadow-xs'
                    : 'bg-white text-[#686868] hover:text-[#026F4F]',
                )}
              >
                {zone}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-[20px]">
          <button
            onClick={() => router.push('/order')}
            className="flex h-[51px] items-center gap-[6px] rounded-[56px] border border-[#B9B9B9] bg-white px-[19px] text-[18px] font-normal leading-[1.4] text-[#686868] transition-colors hover:border-[#026F4F] hover:text-[#026F4F]"
          >
            <ShoppingBag size={30} strokeWidth={1.4} className="shrink-0" />
            <span>Take Out</span>
          </button>
          <button
            onClick={() => router.push('/order')}
            className="flex h-[51px] items-center gap-[6px] rounded-[56px] border border-[#B9B9B9] bg-white px-[19px] text-[18px] font-normal leading-[1.4] text-[#686868] transition-colors hover:border-[#026F4F] hover:text-[#026F4F]"
          >
            <Bike size={30} strokeWidth={1.4} className="shrink-0" />
            <span>Delivery</span>
          </button>
        </div>
      </div>

      {/* ── Table grid (Figma 1759:802) ──────────────────────────────── */}
      <div className="flex flex-wrap gap-x-[46px] gap-y-9 pb-20 pt-9">
        {filteredTables.map((table) => (
          <FloorTableCard
            key={table.id}
            name={table.name}
            zone={table.zone}
            status={table.status}
            itemsCount={table.status === 'occupied' ? table.itemsCount : undefined}
            bill={table.status === 'occupied' && table.orderTotal ? `$${table.orderTotal.toFixed(2)}` : undefined}
            time={table.status === 'occupied' ? table.timeSeated : undefined}
            onClick={() => setActiveModalTable(table)}
          />
        ))}
        {filteredTables.length === 0 && (
          <p className="py-16 text-sm text-[#989898]">No tables in this zone yet.</p>
        )}
      </div>

      {/* ── Table action modal ───────────────────────────────────────── */}
      {activeModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="flex w-[420px] max-w-full animate-in flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h3 className="text-xl font-bold text-black">{activeModalTable.name}</h3>
                <p className="text-xs text-neutral-400">
                  {activeModalTable.zone} • {activeModalTable.capacity} Seats •{' '}
                  <span className="font-semibold uppercase text-[#2D2F33]">{activeModalTable.status}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveModalTable(null)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2 rounded-xl bg-zinc-100 p-3.5">
              {activeModalTable.orderId && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Active Order</span>
                  <span className="font-semibold text-emerald-700">
                    {activeModalTable.orderId} (${activeModalTable.orderTotal?.toFixed(2) ?? '0.00'})
                  </span>
                </div>
              )}
              {activeModalTable.reservedName && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Reserved For</span>
                  <span className="font-semibold text-blue-700">
                    {activeModalTable.reservedName} • {activeModalTable.reservedTime}
                  </span>
                </div>
              )}
              {activeModalTable.status === 'available' && (
                <p className="text-xs text-neutral-500">This table is free. Seat guests to start a new order.</p>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {(activeModalTable.status === 'available' || activeModalTable.status === 'reserved') && (
                <button
                  onClick={() => seatTable(activeModalTable)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#026F4F] text-sm font-medium text-white transition-colors hover:bg-[#015c42]"
                >
                  <Plus size={16} />
                  <span>Start New Order & Seat Guests</span>
                </button>
              )}

              {activeModalTable.status === 'occupied' && (
                <>
                  <button
                    onClick={() => router.push('/order')}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#026F4F] text-sm font-medium text-white transition-colors hover:bg-[#015c42]"
                  >
                    <Plus size={16} />
                    <span>Add Items to Order</span>
                  </button>
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-zinc-100 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-200"
                  >
                    <ArrowRightLeft size={16} />
                    <span>Transfer Table</span>
                  </button>
                  <button
                    onClick={() => clearTable(activeModalTable)}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-medium text-white transition-colors hover:bg-amber-600"
                  >
                    <Receipt size={16} />
                    <span>Print Bill / Request Check</span>
                  </button>
                  <button
                    onClick={() => {
                      clearTable(activeModalTable);
                    }}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  >
                    <CreditCard size={16} />
                    <span>Collect Payment & Clear Table</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Transfer sub-modal ───────────────────────────────────────── */}
      {showTransferModal && activeModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="flex w-[380px] max-w-full flex-col gap-4 rounded-2xl bg-white p-5 shadow-2xl">
            <div>
              <h4 className="text-lg font-bold text-black">Transfer {activeModalTable.name}</h4>
              <p className="mt-1 text-xs text-neutral-400">
                Select an available target table to transfer active order {activeModalTable.orderId}
              </p>
            </div>
            <select
              value={targetTransferTable}
              onChange={(e) => setTargetTransferTable(e.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-black outline-none focus:border-[#026F4F]"
            >
              <option value="">Select Target Table</option>
              {tables
                .filter((t) => t.status === 'available')
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.zone} - {t.capacity} seats)
                  </option>
                ))}
            </select>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowTransferModal(false)}
                className="h-10 flex-1 rounded-xl bg-zinc-100 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferTable}
                disabled={!targetTransferTable}
                className="h-10 flex-1 rounded-xl bg-[#026F4F] text-xs font-medium text-white transition-colors hover:bg-[#015c42] disabled:cursor-not-allowed disabled:bg-zinc-300"
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
