'use client';

import { useEffect, useState } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import {
  ShoppingCart,
  Clock,
  LayoutGrid,
  History,
  Package,
  Settings,
  LogOut,
  Wallet,
  UtensilsCrossed,
} from 'lucide-react';
import { TableRequestModal } from '@/components/pos/TableRequestModal';
import { useQueryModal } from '@/lib/use-query-modal';
import {
  getRequests,
  handleRequest,
  dismissAllRequests,
  subscribeRequests,
  type TableRequest,
} from '@/lib/table-requests';
import { getOrders, pendingCount, subscribeOrders } from '@/lib/running-orders';
import { endShift } from '@/lib/shift-session';
import { LanguageToggle } from './LanguageToggle';

/** Sidebar notification bell — exact Figma glyph (streamline-plump:bell, node 1549:4704). */
function FigmaBell({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 22 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M11 3.5C16.291 3.5 20.6685 7.414 21.3945 12.5045C21.511 13.3245 20.8305 14 20.002 14H1.998C1.1695 14 0.4885 13.325 0.6055 12.5045C1.3315 7.414 5.7085 3.5 11 3.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 6C13.878 6 16.3775 7.621 17.635 10M11 0.5V3.5M13 0.5H9M20.0725 17.0455C20.6775 17.0535 21.3275 17.257 21.4575 17.8475C21.484 17.967 21.5 18.101 21.5 18.25C21.5 18.399 21.484 18.533 21.4575 18.6525C21.3275 19.243 20.6775 19.4465 20.0725 19.4545C18.708 19.472 15.791 19.5 11 19.5C6.209 19.5 3.292 19.472 1.9275 19.4545C1.3225 19.4465 0.6725 19.243 0.5425 18.6525C0.516 18.533 0.5 18.399 0.5 18.25C0.5 18.101 0.516 17.967 0.5425 17.8475C0.6725 17.257 1.3225 17.0535 1.9275 17.0455C3.292 17.028 6.209 17 11 17C15.791 17 18.708 17.028 20.0725 17.0455Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV_KEYS = [
  { id: 'floor-plan',    key: 'floorPlan',    icon: LayoutGrid,   href: '/floor-plan' },
  { id: 'order',         key: 'order',         icon: ShoppingCart, href: '/order' },
  { id: 'menu',          key: 'menu',          icon: UtensilsCrossed, href: '/menu' },
  { id: 'running-order', key: 'runningOrder',  icon: Clock,        href: '/running-order' },
  { id: 'shift',         key: 'shift',         icon: Wallet,       href: '/shift-close' },
  { id: 'history',       key: 'history',       icon: History,      href: '/history' },
  { id: 'inventory',     key: 'inventory',     icon: Package,      href: '/inventory' },
  { id: 'settings',      key: 'settings',      icon: Settings,     href: '/settings' },
] as const;

export function Sidebar() {
  const t = useTranslations('sidebar');
  const pathname = usePathname();
  const router = useRouter();
  const [requests, setRequests] = useState<TableRequest[]>([]);
  const [pendingOrders, setPendingOrders] = useState(0);
  // Query-driven requests drawer: ?modal=requests (all POS pages)
  const [requestsOpen, setRequestsOpen] = useQueryModal('requests');

  useEffect(() => {
    setRequests(getRequests());
    return subscribeRequests(() => setRequests(getRequests()));
  }, []);

  useEffect(() => {
    setPendingOrders(pendingCount(getOrders()));
    return subscribeOrders(() => setPendingOrders(pendingCount(getOrders())));
  }, []);

  useEffect(() => {
    const open = () => setRequestsOpen(true);
    window.addEventListener('pos-open-table-requests', open);
    return () => window.removeEventListener('pos-open-table-requests', open);
  }, []);

  return (
    <>
      <aside className="fixed start-3 top-3 z-30 flex h-[calc(100vh-24px)] w-[89px] flex-col items-center overflow-hidden rounded-xl bg-white shadow-[1px_0_6.6px_rgba(0,0,0,0.08)]">
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

        <div className="h-px w-full bg-[#E9E9E9]" />

        {/* Table Requests bell */}
        <div className="w-full px-2 pt-3">
          <button
            type="button"
            onClick={() => setRequestsOpen(true)}
            title={t('tableRequests')}
            className={cn(
              'group relative mx-auto flex h-[50px] w-[50px] items-center justify-center rounded-full transition-all duration-200',
              requests.length > 0
                ? 'bg-[#026F4F] text-white shadow-md'
                : 'text-[#989898] hover:bg-[#F2F2F2] hover:text-[#2D2F33]',
            )}
          >
            <FigmaBell className="size-6" />
            {requests.length > 0 && (
              <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white ring-2 ring-white">
                {requests.length}
              </span>
            )}
          </button>
          <p className="mt-1 text-center text-[10px] font-medium leading-tight text-[#686868]">
            {t('requests')}
          </p>
        </div>

        <div className="mt-2 h-px w-full bg-[#E9E9E9]" />

        {/* Nav */}
        <nav className="flex w-full flex-1 flex-col items-center justify-start gap-3 overflow-hidden px-2 py-3">
          {NAV_KEYS.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(item.href.replace(/\/?$/, ''));
            const Icon = item.icon;
            const label = t(item.key as any);
            const badge = item.id === 'running-order' ? pendingOrders : 0;
            // Locale-aware link: keeps /ar when switching languages.
            return (
              <Link
                key={item.id}
                href={item.href}
                title={label}
                className={cn(
                  'group relative flex h-[50px] w-[50px] items-center justify-center rounded-full transition-all duration-200',
                  active
                    ? 'bg-[#026F4F] text-white shadow-md'
                    : 'text-[#989898] hover:bg-[#F2F2F2] hover:text-[#2D2F33]',
                )}
              >
                <Icon size={24} strokeWidth={active ? 2.2 : 1.8} />
                {badge > 0 && (
                  <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white ring-2 ring-white">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Language toggle — same component as Owner, stacked to fit the rail */}
        <div className="w-full px-1 pb-1">
          <LanguageToggle className="w-full flex-col gap-1 rounded-xl bg-[#F2F2F2] p-1 [&_button]:w-full" />
        </div>

        {/* Logout */}
        <div className="w-full border-t border-[#F2F2F2] py-3 flex justify-center">
          <button
            title={t('logout')}
            onClick={() => {
              if (confirm(t('logoutConfirm'))) {
                endShift();
                router.replace('/shift');
              }
            }}
            className="flex h-[50px] w-[50px] items-center justify-center rounded-full text-[#989898] transition-colors hover:bg-[#FFE6E6] hover:text-[#E56767]"
          >
            <LogOut size={24} strokeWidth={1.8} />
          </button>
        </div>
      </aside>

      {requestsOpen && (
        <TableRequestModal
          requests={requests}
          onClose={() => setRequestsOpen(false)}
          onDismissAll={() => {
            dismissAllRequests();
            setRequestsOpen(false);
          }}
          onHandled={handleRequest}
        />
      )}
    </>
  );
}
