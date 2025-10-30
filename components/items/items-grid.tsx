"use client"

import type { Item, DepositStock } from "@/lib/types"
import { ItemCard } from "./item-card"

interface ItemsGridProps {
  items: Item[]
  gridSize: string
  itemSelected: boolean[]
  expandedItems: Record<number, boolean>
  handleItemButtonClick: (index: number) => void
  handleItemClick: (item: Item, tab: string, isContainer?: boolean) => void
  toggleVariantExpansion: (index: number) => void
  updateDepositStock?: (itemSku: string, depositId: string, quantity: number) => void
  depositStock?: DepositStock[]
  onDeleteItem?: (item: Item) => void
}

export function ItemsGrid({
  items,
  gridSize,
  itemSelected,
  expandedItems,
  handleItemButtonClick,
  handleItemClick,
  toggleVariantExpansion,
  updateDepositStock,
  depositStock,
  onDeleteItem,
}: ItemsGridProps) {
  return (
    <div className={`px-8 flex flex-col pb-8 mt-1 ${gridSize === "lg" ? "gap-2" : "gap-0"}`}>
      <div className={gridSize === "lg" ? "space-y-2" : "space-y-0"}>
        {items.map((item, index) => (
          <ItemCard
            key={index}
            item={item}
            index={index}
            gridSize={gridSize}
            isSelected={itemSelected[index]}
            isExpanded={expandedItems[index]}
            onSelectClick={handleItemButtonClick}
            onItemClick={handleItemClick}
            onToggleExpansion={toggleVariantExpansion}
            onDelete={onDeleteItem}
          />
        ))}
      </div>
    </div>
  )
}
