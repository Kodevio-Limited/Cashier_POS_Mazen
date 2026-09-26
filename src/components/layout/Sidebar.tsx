'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  ShoppingCart,
  Clock,
  LayoutGrid,
  History,
  Package,
  Settings,
  LogOut,
  Bell,
} from 'lucide-react';
import { TableRequestModal } from '@/components/pos/TableRequestModal';
import {
  getRequests,
  handleRequest,
  dismissAllRequests,
  subscribeRequests,
  type TableRequest,
} from '@/lib/table-requests';
import { getOrders, pendingCount, subscribeOrders } from '@/lib/running-orders';

const NAV_ITEMS = [
  { id: 'floor-plan', label: 'Floor Plan', icon: LayoutGrid, href: '/floor-plan' },
  { id: 'order', label: 'Order', icon: ShoppingCart, href: '/order' },
  { id: 'running-order', label: 'Running Order', icon: Clock, href: '/running-order' },
  { id: 'history', label: 'History', icon: History, href: '/history' },
  { id: 'inventory', label: 'Inventory', icon: Package, href: '/inventory' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [requests, setRequests] = useState<TableRequest[]>([]);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [showRequests, setShowRequests] = useState(false);

  // Keep the always-visible badge in sync with the shared request store.
  useEffect(() => {
    setRequests(getRequests());
    return subscribeRequests(() => setRequests(getRequests()));
  }, []);

  // Pending (not-yet-accepted) running orders badge.
  useEffect(() => {
    setPendingOrders(pendingCount(getOrders()));
    return subscribeOrders(() => setPendingOrders(pendingCount(getOrders())));
  }, []);

  // Opening from a toast elsewhere in the app.
  useEffect(() => {
    const open = () => setShowRequests(true);
    window.addEventListener('pos-open-table-requests', open);
    return () => window.removeEventListener('pos-open-table-requests', open);
  }, []);

  return (
    <>
      <aside className="fixed left-3 top-3 z-30 flex h-[calc(100vh-24px)] w-[89px] flex-col items-center overflow-hidden rounded-xl bg-white shadow-[1px_0_6.6px_rgba(0,0,0,0.08)]">
        {/* Logo */}
        <div className="flex h-[68px] w-full items-center justify-center px-2 py-2">
          <div className="relative h-[20px] w-[68px]">
            <Image
              src="/images/logo-69e842.png"
              alt="Restaurant logo"
              fill
              priority
              sizes="68px"
              className="object-contain"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-[#E9E9E9]" />

        {/* Table Requests — always visible, under the logo */}
        <div className="w-full px-2 pt-3">
          <button
            type="button"
            onClick={() => setShowRequests(true)}
            title="Table Requests"
            className={cn(
              'group relative mx-auto flex h-[50px] w-[50px] items-center justify-center rounded-full transition-all duration-200',
              requests.length > 0
                ? 'bg-[#026F4F] text-white shadow-md'
                : 'text-[#989898] hover:bg-[#F2F2F2] hover:text-[#2D2F33]',
            )}
          >
            <Bell size={24} strokeWidth={requests.length > 0 ? 2.2 : 1.8} />
            {requests.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white ring-2 ring-white">
                {requests.length}
              </span>
            )}
          </button>
          <p className="mt-1 text-center text-[10px] font-medium leading-tight text-[#686868]">
            Requests
          </p>
        </div>

        <div className="mt-2 h-px w-full bg-[#E9E9E9]" />

        {/* Nav */}
        <nav className="flex w-full flex-1 flex-col items-center justify-start gap-3 overflow-hidden px-2 py-3">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '#' && pathname.startsWith(item.href.replace(/\/?$/, '')));
            const Icon = item.icon;
            const badge = item.id === 'running-order' ? pendingOrders : 0;
            return (
              <Link
                key={item.id}
                href={item.href}
                title={item.label}
                className={cn(
                  'group relative flex h-[50px] w-[50px] items-center justify-center rounded-full transition-all duration-200',
                  active
                    ? 'bg-[#026F4F] text-white shadow-md'
                    : 'text-[#989898] hover:bg-[#F2F2F2] hover:text-[#2D2F33]',
                )}
              >
                <Icon size={24} strokeWidth={active ? 2.2 : 1.8} />
                {badge > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white ring-2 ring-white">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="w-full border-t border-[#F2F2F2] py-3 flex justify-center">
          <button
            title="Log Out"
            className="flex h-[50px] w-[50px] items-center justify-center rounded-full text-[#989898] transition-colors hover:bg-[#FFE6E6] hover:text-[#E56767]"
          >
            <LogOut size={24} strokeWidth={1.8} />
          </button>
        </div>
      </aside>

      {showRequests && (
        <TableRequestModal
          requests={requests}
          onClose={() => setShowRequests(false)}
          onDismissAll={() => {
            dismissAllRequests();
            setShowRequests(false);
          }}
          onHandled={handleRequest}
        />
      )}
    </>
  );
}
