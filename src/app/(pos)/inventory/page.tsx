'use client';

import { useState } from 'react';
import {
  INITIAL_INGREDIENTS,
  INITIAL_RECIPES,
  INITIAL_PURCHASES,
  INITIAL_TRANSFERS,
  INITIAL_COUNTS,
  INITIAL_WASTE,
  type Ingredient,
  type InvTab,
  type Recipe,
} from '@/components/pos/inventory/types';
import { InventoryHeader } from '@/components/pos/inventory/InventoryShell';
import {
  StockTab,
  RecipeTab,
  PurchasesTab,
  TransfersTab,
  PhysicalCountTab,
  WasteLogTab,
} from '@/components/pos/inventory/InventoryTabs';
import {
  AddIngredientDrawer,
  LogPurchaseDrawer,
  RecipeMappingDrawer,
  TransferStockDrawer,
  type IngredientForm,
  type PurchaseForm,
  type TransferForm,
} from '@/components/pos/inventory/InventoryDrawers';
import type { CountEntry, Purchase, Transfer, WasteEntry, RecipeMap } from '@/components/pos/inventory/types';

type DrawerState =
  | { kind: 'add' }
  | { kind: 'edit'; ingredient: Ingredient }
  | { kind: 'purchase' }
  | { kind: 'mapping'; recipe: Recipe }
  | { kind: 'transfer' }
  | null;

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<InvTab>('Stock');
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  const [purchases, setPurchases] = useState<Purchase[]>(INITIAL_PURCHASES);
  const [transfers, setTransfers] = useState<Transfer[]>(INITIAL_TRANSFERS);
  const [counts, setCounts] = useState<CountEntry[]>(INITIAL_COUNTS);
  const [waste, setWaste] = useState<WasteEntry[]>(INITIAL_WASTE);
  const [drawer, setDrawer] = useState<DrawerState>(null);

  // ── Stock ──
  function handleSaveIngredient(f: IngredientForm, existingId?: string) {
    if (existingId) {
      setIngredients((prev) => prev.map((i) => (i.id === existingId ? { ...i, name: f.name, qty: f.qty, unit: f.unit, threshold: f.threshold, avgPrice: f.avgPrice, updatedAgo: 'Just now' } : i)));
    } else {
      setIngredients((prev) => [...prev, { id: `ing-${Date.now()}`, name: f.name, qty: f.qty, capacity: Math.max(f.qty, f.threshold), unit: f.unit, threshold: f.threshold, avgPrice: f.avgPrice, updatedAgo: 'Just now' }]);
    }
    setDrawer(null);
  }

  function handleDeleteIngredient(id: string) {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  }

  // ── Purchases ──
  function handleLogPurchase(f: PurchaseForm) {
    const poId = `PO-${886 + purchases.length}`;
    setPurchases((prev) => [{ id: poId, date: f.date, ingredient: f.ingredientName, qty: f.qty, unit: ingredients.find((i) => i.name === f.ingredientName)?.unit ?? 'pcs', avgCost: f.qty > 0 ? f.totalCost / f.qty : 0, total: f.totalCost, supplier: f.supplier }, ...prev]);
    // Weighted moving average: (old stock value + purchase cost) / new stock.
    setIngredients((prev) => prev.map((i) => {
      if (i.name !== f.ingredientName) return i;
      const newQty = i.qty + f.qty;
      const avgPrice = newQty > 0 ? (i.qty * i.avgPrice + f.totalCost) / newQty : i.avgPrice;
      return { ...i, qty: newQty, avgPrice, updatedAgo: 'Just now' };
    }));
    setDrawer(null);
  }

  // ── Recipe mapping ──
  function handleSaveMapping(recipeId: string, maps: RecipeMap[]) {
    setRecipes((prev) => prev.map((r) => (r.id === recipeId ? { ...r, maps } : r)));
    setDrawer(null);
  }

  // ── Transfers ──
  function handleSaveTransfer(f: TransferForm) {
    const trId = `TR-${886 + transfers.length}`;
    const unit = ingredients.find((i) => i.name === f.ingredientName)?.unit ?? 'pcs';
    setTransfers((prev) => [{ id: trId, date: f.date, ingredient: f.ingredientName, qty: f.qty, unit, from: f.from, to: f.to, status: 'COMPLETED' }, ...prev]);
    setDrawer(null);
  }

  // ── Physical count ──
  function handleSubmitCount(ingredientId: string, phys: number) {
    const ing = ingredients.find((i) => i.id === ingredientId);
    if (!ing) return;
    setCounts((prev) => [{ id: `c-${Date.now()}`, date: '2023-10-25', ingredient: ing.name, theo: ing.qty, phys }, ...prev]);
  }

  // ── Waste ──
  function handleSubmitWaste(e: { ingredientId: string; qty: number; unit: string; reason: string; responsible: string; notes: string }) {
    const ing = ingredients.find((i) => i.id === e.ingredientId);
    if (!ing) return;
    setWaste((prev) => [{ id: `w-${Date.now()}`, date: '2023-10-25', item: ing.name, note: e.notes || e.reason, qty: e.qty, unit: e.unit, reason: e.reason, loggedBy: e.responsible }, ...prev]);
    setIngredients((prev) => prev.map((i) => (i.id === e.ingredientId ? { ...i, qty: Math.max(0, i.qty - e.qty), updatedAgo: 'Just now' } : i)));
  }

  return (
    <div className="flex min-h-[calc(100vh-38px)] flex-col gap-[19px] bg-[#F2F2F2]">
      <InventoryHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="pb-20">
        {activeTab === 'Stock' && (
          <StockTab
            ingredients={ingredients}
            onAdd={() => setDrawer({ kind: 'add' })}
            onEdit={(ing) => setDrawer({ kind: 'edit', ingredient: ing })}
            onDelete={handleDeleteIngredient}
          />
        )}
        {activeTab === 'Recipe' && (
          <RecipeTab recipes={recipes} ingredients={ingredients} onEditRecipe={(r) => setDrawer({ kind: 'mapping', recipe: r })} />
        )}
        {activeTab === 'Purchases' && <PurchasesTab purchases={purchases} onLogPurchase={() => setDrawer({ kind: 'purchase' })} />}
        {activeTab === 'Transfers' && <TransfersTab transfers={transfers} onNewTransfer={() => setDrawer({ kind: 'transfer' })} />}
        {activeTab === 'Physical Count' && <PhysicalCountTab counts={counts} ingredients={ingredients} onSubmit={handleSubmitCount} />}
        {activeTab === 'Waste log' && <WasteLogTab entries={waste} ingredients={ingredients} onSubmit={handleSubmitWaste} />}
      </div>

      {/* Drawers */}
      {drawer?.kind === 'add' && (
        <AddIngredientDrawer onBack={() => setDrawer(null)} onSave={(f) => handleSaveIngredient(f)} />
      )}
      {drawer?.kind === 'edit' && (
        <AddIngredientDrawer initial={drawer.ingredient} onBack={() => setDrawer(null)} onSave={(f) => handleSaveIngredient(f, drawer.ingredient.id)} />
      )}
      {drawer?.kind === 'purchase' && (
        <LogPurchaseDrawer ingredients={ingredients} onBack={() => setDrawer(null)} onSave={handleLogPurchase} />
      )}
      {drawer?.kind === 'mapping' && (
        <RecipeMappingDrawer
          recipeName={drawer.recipe.name}
          ingredients={ingredients}
          initialMaps={drawer.recipe.maps}
          onBack={() => setDrawer(null)}
          onSave={(maps) => handleSaveMapping(drawer.recipe.id, maps)}
        />
      )}
      {drawer?.kind === 'transfer' && (
        <TransferStockDrawer ingredients={ingredients} onBack={() => setDrawer(null)} onSave={handleSaveTransfer} />
      )}
    </div>
  );
}
