'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  ShoppingCart,
  Clock,
  LayoutGrid,
  History,
  Timer,
  Package,
  Settings,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'order', label: 'Order', icon: ShoppingCart, href: '/order' },
  { id: 'running-order', label: 'Running Order', icon: Clock, href: '/running-order' },
  { id: 'floor-plan', label: 'Floor Plan', icon: LayoutGrid, href: '/floor-plan' },
  { id: 'history', label: 'History', icon: History, href: '/history' },
  { id: 'shift', label: 'Shift', icon: Timer, href: '/shift' },
  { id: 'inventory', label: 'Inventory', icon: Package, href: '/inventory' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
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

      {/* Nav */}
      <nav className="flex flex-1 flex-col items-center gap-4 overflow-y-auto py-4">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '#' && pathname.startsWith(item.href.replace(/\/?$/, '')));
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              className={cn(
                'group flex h-[50px] w-[50px] items-center justify-center rounded-full transition-all duration-200',
                active
                  ? 'bg-[#026F4F] text-white shadow-md'
                  : 'text-[#989898] hover:bg-[#F2F2F2] hover:text-[#2D2F33]',
              )}
            >
              <Icon size={24} strokeWidth={active ? 2.2 : 1.8} />
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
  );
}
