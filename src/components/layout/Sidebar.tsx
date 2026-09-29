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
  Bell,
  Wallet,
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
import { endShift } from '@/lib/shift-session';
import { LanguageToggle } from './LanguageToggle';

const NAV_KEYS = [
  { id: 'floor-plan',    key: 'floorPlan',    icon: LayoutGrid,   href: '/floor-plan' },
  { id: 'order',         key: 'order',         icon: ShoppingCart, href: '/order' },
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
  const [showRequests, setShowRequests] = useState(false);

  useEffect(() => {
    setRequests(getRequests());
    return subscribeRequests(() => setRequests(getRequests()));
  }, []);

  useEffect(() => {
    setPendingOrders(pendingCount(getOrders()));
    return subscribeOrders(() => setPendingOrders(pendingCount(getOrders())));
  }, []);

  useEffect(() => {
    const open = () => setShowRequests(true);
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
            onClick={() => setShowRequests(true)}
            title={t('tableRequests')}
            className={cn(
              'group relative mx-auto flex h-[50px] w-[50px] items-center justify-center rounded-full transition-all duration-200',
              requests.length > 0
                ? 'bg-[#026F4F] text-white shadow-md'
                : 'text-[#989898] hover:bg-[#F2F2F2] hover:text-[#2D2F33]',
            )}
          >
            <Bell size={24} strokeWidth={requests.length > 0 ? 2.2 : 1.8} />
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
