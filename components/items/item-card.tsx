"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { ChevronDown, ChevronRight, MoreVertical, Trash2, Copy } from "lucide-react"
import type { Item } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ItemCardProps {
  item: Item
  index: number
  gridSize: string
  isSelected: boolean
  isExpanded: boolean
  onSelectClick: (index: number) => void
  onItemClick: (item: Item) => void
  onToggleExpansion: (index: number) => void
  onDelete?: (item: Item) => void
  nextItem?: Item
  isChild?: boolean
  isLastChild?: boolean
}

function calculateMarginBottom(currentItem: Item, nextItem: Item | undefined, isChild: boolean): string {
  if (isChild) return "mb-0"
  if (!nextItem) return "mb-0"
  return "mb-px"
}

export function ItemCard({
  item,
  index,
  gridSize,
  isSelected,
  isExpanded,
  onSelectClick,
  onItemClick,
  onToggleExpansion,
  onDelete,
  nextItem,
  isChild = false,
  isLastChild = false,
}: ItemCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [copiedSku, setCopiedSku] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const variantCount = useMemo(() => {
    return item.variantCount || item.variants?.length || 0
  }, [item.variantCount, item.variants])

  const itemCount = useMemo(() => {
    return item.itemCount || item.items?.length || 0
  }, [item.itemCount, item.items])

  const marginClass = calculateMarginBottom(item, nextItem, isChild)
  const isParent = item.isAgrupador || item.hasVariants

  const getRoundedClass = () => {
    if (isChild) {
      return isLastChild ? "rounded-b" : ""
    }
    if (isParent) {
      return isExpanded ? "rounded-t" : "rounded"
    }
    return "rounded"
  }

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const handleCopySku = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(item.sku)
    setCopiedSku(true)
    setTimeout(() => setCopiedSku(false), 2000)
  }

  const rowHeight = gridSize === "lg" ? "h-16" : gridSize === "md" ? "h-12" : "h-10"

  return (
    <div className={marginClass}>
      <div
        className="flex items-center gap-0"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Selection checkbox */}
        <div
          className="flex items-center justify-center w-8 flex-shrink-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            onSelectClick(index)
          }}
        >
          <div
            className={`w-3.5 h-3.5 rounded-sm border transition-all duration-150 ${
              isSelected
                ? "bg-slate-800 border-slate-800"
                : isHovered
                  ? "border-slate-400"
                  : "border-slate-300"
            } ${!isHovered && !isSelected ? "opacity-0" : "opacity-100"}`}
          />
        </div>

        {/* Main row content */}
        <div
          className={`flex-1 ${rowHeight} ${getRoundedClass()} grid grid-cols-12 items-center bg-white border border-slate-200/80 hover:border-slate-300/80 transition-all cursor-pointer ${
            isChild ? "bg-slate-50/50" : ""
          }`}
          onClick={(e) => {
            if (isParent) {
              onToggleExpansion(index)
            } else {
              onItemClick(item)
            }
          }}
        >
          {/* Left section - Item info (5 cols) */}
          <div
            className="col-span-5 flex items-center gap-3 h-full px-4 border-r border-slate-100"
            onClick={(e) => {
              e.stopPropagation()
              onItemClick(item)
            }}
          >
            {isParent && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleExpansion(index)
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium truncate ${isChild ? "text-slate-500" : "text-slate-800"}`}>
                  {item.name}
                </span>
                {isParent && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                    {item.hasVariants ? variantCount : itemCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-slate-400 font-mono">{item.sku}</span>
                <button
                  onClick={handleCopySku}
                  className={`p-0.5 transition-colors ${copiedSku ? "text-emerald-500" : "text-slate-300 hover:text-slate-500"}`}
                  title={copiedSku ? "Copiado" : "Copiar SKU"}
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Center section - Attributes (4 cols) */}
          <div className="col-span-4 flex items-center justify-center h-full px-4 border-r border-slate-100">
            {isParent ? (
              <span className="text-xs text-slate-400">
                {item.hasVariants ? `${variantCount} variantes` : `${itemCount} items`}
              </span>
            ) : item.atributosPrincipales && item.atributosPrincipales.length > 0 ? (
              <div className="flex items-center gap-4">
                {item.atributosPrincipales.slice(0, 2).map((attr, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">{attr.key}</span>
                    <span className="text-xs text-slate-600 font-medium">{attr.value || "-"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-300">-</span>
            )}
          </div>

          {/* Right section - Stock (3 cols) */}
          <div className="col-span-3 flex items-center justify-center h-full px-4">
            {isParent ? (
              <span className="text-xs text-slate-300">-</span>
            ) : (
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider">Total</span>
                  <span className="text-sm text-slate-700 font-semibold tabular-nums">{item.stock?.total || 0}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider">Disp</span>
                  <span className="text-sm text-slate-700 font-semibold tabular-nums">{item.stock?.disponible || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={`flex items-center justify-center w-10 flex-shrink-0 ${!isHovered ? "opacity-0" : "opacity-100"} transition-opacity`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded hover:bg-slate-100"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(item)
                }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Child items */}
      {item.hasVariants && isExpanded && item.variants && (
        <div className="ml-8">
          {item.variants.map((variant: any, variantIndex: number) => (
            <ItemCard
              key={variantIndex}
              item={variant}
              index={variantIndex}
              gridSize={gridSize}
              isSelected={false}
              isExpanded={false}
              onSelectClick={() => {}}
              onItemClick={onItemClick}
              onToggleExpansion={() => {}}
              onDelete={onDelete}
              nextItem={item.variants?.[variantIndex + 1]}
              isChild={true}
              isLastChild={variantIndex === item.variants.length - 1}
            />
          ))}
        </div>
      )}

      {item.isAgrupador && isExpanded && item.items && (
        <div className="ml-8">
          {item.items.map((groupItem, groupItemIndex) => (
            <ItemCard
              key={groupItemIndex}
              item={groupItem}
              index={groupItemIndex}
              gridSize={gridSize}
              isSelected={false}
              isExpanded={false}
              onSelectClick={() => {}}
              onItemClick={onItemClick}
              onToggleExpansion={() => {}}
              onDelete={onDelete}
              nextItem={item.items?.[groupItemIndex + 1]}
              isChild={true}
              isLastChild={groupItemIndex === item.items.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
