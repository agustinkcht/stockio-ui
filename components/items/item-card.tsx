"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Copy, Pencil, Trash2, MoreHorizontal } from "lucide-react"
import type { Item } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ItemCardProps {
  item: Item
  index: number
  gridSize: string
  isSelected: boolean
  isExpanded: boolean
  onSelectClick: (index: number) => void
  onItemClick: (item: Item, tab: string, isContainer?: boolean) => void
  onToggleExpansion: (index: number) => void
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
}: ItemCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div>
      <div
        className="flex items-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`flex-1 ${gridSize === "lg" ? "h-18" : gridSize === "md" ? "h-12" : "h-6"} ${gridSize !== "lg" ? "rounded-xs" : "rounded-md"} grid grid-cols-[auto_5fr_3fr_3fr_auto] ${
            item.isAgrupador || item.hasVariants
              ? `bg-cyan-9 border border-gray-800 hover:bg-slate-900/30 transition-colors cursor-pointer ${
                  item.hasVariants ? "border-l-4 border-l-green-500/50" : "border-l-4 border-l-blue-500/50"
                }`
              : "bg-slate-900 border border-gray-800"
          }`}
          onClick={(e) => {
            if (item.hasVariants || item.isAgrupador) {
              onToggleExpansion(index)
            }
          }}
        >
          <div className="flex items-center justify-center px-3 border-r border-gray-700">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelectClick(index)
              }}
              className={`w-4 h-4 ${isSelected ? "bg-gray-400" : "bg-gray-800"} border border-gray-700 rounded-md hover:cursor-pointer transition-colors flex items-center justify-center flex-shrink-0`}
            ></button>
          </div>

          <div
            className={`flex flex-col justify-center h-full border-r border-gray-700 ${gridSize === "sm" ? "gap-0" : "gap-0.5"} px-4 cursor-pointer transition-colors ${
              item.hasVariants || item.isAgrupador ? "hover:bg-gray-800/50" : "hover:bg-gray-800/50"
            }`}
            onClick={(e) => {
              e.stopPropagation()
              console.log("[v0] Título segment clicked, navigating to info tab")
              if (item.hasVariants || item.isAgrupador) {
                onItemClick(item, "info", true)
              } else {
                onItemClick(item, "info", false)
              }
            }}
          >
            <div className="flex items-center gap-2">
              {(item.hasVariants || item.isAgrupador) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleExpansion(index)
                  }}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              )}
              <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                {(item as any).displayTitle || item.name}
              </span>
            </div>
            {gridSize !== "sm" && !item.hasVariants && !item.isAgrupador && item.sku && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(item.sku)
                }}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 font-mono hover:text-gray-400 transition-colors group w-fit"
              >
                <span>SKU: {item.sku}</span>
                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          {item.hasVariants ? (
            <>
              <div className="h-full flex items-center justify-center border-r border-gray-700 px-4">
                <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>Item con variantes</span>
              </div>
              <div className="h-full flex items-center justify-center border-r border-gray-700 px-4">
                <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-400`}>
                  {item.variantCount} variantes
                </span>
              </div>
            </>
          ) : item.isAgrupador ? (
            <>
              <div className="h-full flex items-center justify-center border-r border-gray-700 px-4">
                <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>Grupo</span>
              </div>
              <div className="h-full flex items-center justify-center border-r border-gray-700 px-4">
                <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-400`}>
                  {item.itemCount} items
                </span>
              </div>
            </>
          ) : (
            <>
              <div
                className="h-full flex items-center gap-3 border-r border-gray-700 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  console.log("[v0] Atributos segment clicked, navigating to atributos tab")
                  onItemClick(item, "atributos")
                }}
              >
                {item.atributosPrincipales && item.atributosPrincipales.length > 0 ? (
                  <>
                    {item.atributosPrincipales.map((attr, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
                        {gridSize !== "sm" && (
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide truncate w-full text-center">
                            {attr.key}
                          </span>
                        )}
                        <span
                          className={`${gridSize === "sm" ? "text-xs" : "text-sm"} ${attr.value ? "text-gray-300" : "text-gray-500"} truncate w-full text-center`}
                          title={attr.value || "-"}
                        >
                          {attr.value || "-"}
                        </span>
                      </div>
                    ))}
                    {item.atributosPrincipales.length === 1 && (
                      <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
                        {gridSize !== "sm" && (
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide"></span>
                        )}
                        <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-500`}>-</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-0.5 flex-1">
                      <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-500`}>-</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 flex-1">
                      <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-500`}>-</span>
                    </div>
                  </>
                )}
              </div>

              <div
                className="h-full flex items-center gap-3 border-r border-gray-700 px-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  console.log("[v0] Stock segment clicked, navigating to stock tab")
                  onItemClick(item, "stock")
                }}
              >
                <div className="flex flex-col items-center gap-0.5 flex-1">
                  {gridSize !== "sm" && (
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">Total</span>
                  )}
                  <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                    {item.stock?.total || 0}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-0.5 flex-1">
                  {gridSize !== "sm" && (
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">Reservado</span>
                  )}
                  <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                    {item.stock?.reservado || 0}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-0.5 flex-1">
                  {gridSize !== "sm" && (
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">Disponible</span>
                  )}
                  <span className={`${gridSize === "sm" ? "text-xs" : "text-sm"} text-gray-300`}>
                    {item.stock?.disponible || 0}
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-3 px-4">
            <div className={`flex items-center gap-3 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  console.log("[v0] Edit button clicked")
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  console.log("[v0] Delete button clicked")
                }}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log("[v0] Duplicar clicked for item:", item.name)
                    }}
                  >
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log("[v0] Mover clicked for item:", item.name)
                    }}
                  >
                    Mover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {item.hasVariants && isExpanded && item.variants && (
        <div className={gridSize === "lg" ? "mt-2 space-y-2" : "mt-0 space-y-0"}>
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
            />
          ))}
        </div>
      )}

      {item.isAgrupador && isExpanded && item.items && (
        <div className={gridSize === "lg" ? "mt-2 space-y-2" : "mt-0 space-y-0"}>
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
