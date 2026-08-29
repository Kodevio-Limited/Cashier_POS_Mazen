'use client';

import { useState } from 'react';
import { Search, Plus, AlertTriangle, Package, CheckCircle2, RefreshCw, X, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryItem {
  id: string;
  name: string;
  category: 'Burgers' | 'Ramen' | 'Sides' | 'Drinks' | 'Desserts';
  stock: number;
  reorderLevel: number;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  emoji: string;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv1', name: 'Shoyu Ramen', category: 'Ramen', stock: 45, reorderLevel: 10, price: 15.99, status: 'In Stock', emoji: '🍜' },
  { id: 'inv2', name: 'Tonkotsu Ramen', category: 'Ramen', stock: 8, reorderLevel: 10, price: 18.99, status: 'Low Stock', emoji: '🍜' },
  { id: 'inv3', name: 'Classic Burger', category: 'Burgers', stock: 24, reorderLevel: 8, price: 15.99, status: 'In Stock', emoji: '🍔' },
  { id: 'inv4', name: 'BBQ Bacon Burger', category: 'Burgers', stock: 0, reorderLevel: 5, price: 19.99, status: 'Out of Stock', emoji: '🍔' },
  { id: 'inv5', name: 'French Fries', category: 'Sides', stock: 60, reorderLevel: 15, price: 4.99, status: 'In Stock', emoji: '🍟' },
  { id: 'inv6', name: 'Iced Green Tea', category: 'Drinks', stock: 32, reorderLevel: 12, price: 3.99, status: 'In Stock', emoji: '🍵' },
  { id: 'inv7', name: 'Coca-Cola', category: 'Drinks', stock: 5, reorderLevel: 10, price: 2.99, status: 'Low Stock', emoji: '🥤' },
];

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Stock' | 'Low Stock' | 'Out of Stock'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeRestockItem, setActiveRestockItem] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const lowStockCount = inventory.filter((i) => i.status === 'Low Stock' || i.status === 'Out of Stock').length;

  function handleRestockConfirm() {
    if (!activeRestockItem) return;
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === activeRestockItem.id) {
          const newStock = item.stock + restockAmount;
          const newStatus = newStock > item.reorderLevel ? 'In Stock' : newStock > 0 ? 'Low Stock' : 'Out of Stock';
          return { ...item, stock: newStock, status: newStatus };
        }
        return item;
      }),
    );
    setActiveRestockItem(null);
  }

  return (
    <div className="flex h-[calc(100vh-24px)] flex-col gap-3 bg-[#F2F2F2] p-1.5 rounded-2xl overflow-hidden">
      {/* Top Header */}
      <div className="flex justify-between items-center px-5 py-3.5 bg-white rounded-xl border border-[#E9E9E9]">
        <div>
          <h1 className="text-black text-xl font-medium font-['Inter']">Inventory & Stock Control</h1>
          <p className="text-neutral-400 text-xs font-normal font-['Inter']">Track item availability, reorder limits, and update stock counts</p>
        </div>

        {/* Search */}
        <div className="relative w-72">
          <Search size={16} className="absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-zinc-100 border border-zinc-200 rounded-full text-xs text-black focus:outline-hidden focus:border-[#026F4F]"
          />
        </div>
      </div>

      {/* Summary Banner */}
      <div className="flex justify-between items-center bg-white rounded-xl p-4 border border-[#E9E9E9]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-black font-semibold text-sm">Stock Alert Overview</p>
            <p className="text-xs text-neutral-400">{lowStockCount} items require immediate restocking</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['All', 'Burgers', 'Ramen', 'Sides', 'Drinks'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-all',
                selectedCategory === cat
                  ? 'bg-[#026F4F] text-white shadow-xs'
                  : 'bg-[#F2F2F2] text-stone-500 hover:text-black',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="flex-1 bg-white rounded-xl overflow-hidden border border-[#E9E9E9] flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs text-black">
            <thead className="bg-[#F2F2F2] text-neutral-500 font-medium sticky top-0 border-b border-zinc-200">
              <tr>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Reorder Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-black flex items-center gap-2">
                    <span className="text-lg">{item.emoji}</span>
                    <span>{item.name}</span>
                  </td>
                  <td className="py-3 px-4 text-neutral-400">{item.category}</td>
                  <td className="py-3 px-4 font-medium text-[#026F4F]">${item.price.toFixed(2)}</td>
                  <td className="py-3 px-4 font-bold text-sm">{item.stock} units</td>
                  <td className="py-3 px-4 text-neutral-400">{item.reorderLevel} units</td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-semibold',
                        item.status === 'In Stock' && 'bg-emerald-100 text-emerald-800',
                        item.status === 'Low Stock' && 'bg-amber-100 text-amber-800',
                        item.status === 'Out of Stock' && 'bg-rose-100 text-rose-800',
                      )}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setActiveRestockItem(item)}
                      className="px-3 py-1.5 rounded-lg bg-[#026F4F] hover:bg-[#015c42] text-white text-xs font-medium transition-colors"
                    >
                      Restock Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {activeRestockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="w-80 bg-white rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
              <h3 className="font-bold text-black text-base">Restock {activeRestockItem.name}</h3>
              <button onClick={() => setActiveRestockItem(null)} className="text-neutral-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs text-neutral-400">Current Stock: <span className="font-bold text-black">{activeRestockItem.stock} units</span></p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-black font-medium">Add Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 border border-zinc-300 rounded-xl text-sm font-bold text-black focus:outline-hidden focus:border-[#026F4F]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setActiveRestockItem(null)}
                className="flex-1 h-10 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleRestockConfirm}
                className="flex-1 h-10 bg-[#026F4F] hover:bg-[#015c42] text-white rounded-xl font-medium text-xs"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
