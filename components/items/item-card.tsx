"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Copy, MoreVertical } from "lucide-react"
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
  onDelete?: (item: Item) => void
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
}: ItemCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div>
      <div
        className="flex items-center gap-2 bg-transparent"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelectClick(index)
            }}
            className={`relative left-[-8px] h-4.5 w-4.5 transition-colors cursor-pointer flex items-center justify-center border-2 text-sidebar-accent bg-slate-900 rounded-full ${
              isSelected ? "bg-primary border-primary hover:opacity-90" : "bg-transparent border-border"
            }`}
          ></button>
        </div>

        <div
          className={`flex-1 border-slate-100 ${gridSize === "lg" ? "h-22" : gridSize === "md" ? "h-14" : "h-9"} ${gridSize !== "lg" ? "rounded-xs" : "rounded-md"} grid grid-cols-14 ${
            item.isAgrupador || item.hasVariants
              ? `bg-white border border-border hover:bg-gray-50 transition-colors cursor-pointer`
              : "bg-white border border-border"
          }`}
          onClick={(e) => {
            if (item.hasVariants || item.isAgrupador) {
              onToggleExpansion(index)
            }
          }}
        >
          {/* Título Column */}
          <div
            className={`col-span-4 flex flex-col justify-center h-full border-r bg-white ${
              item.hasVariants || item.isAgrupador ? "border-border" : "border-border"
            } px-4 cursor-pointer transition-colors ${
              item.hasVariants || item.isAgrupador ? "hover:bg-gray-50" : "hover:bg-gray-50"
            }`}
            onClick={(e) => {
              e.stopPropagation()
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
                  className={`transition-colors cursor-pointer ${
                    item.hasVariants || item.isAgrupador
                      ? "text-container-item-foreground hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              )}
              <span
                className={`${gridSize === "sm" ? "text-sm" : "text-sm"} ${
                  item.hasVariants || item.isAgrupador
                    ? "text-container-item-foreground font-medium"
                    : "text-foreground"
                }`}
              >
                {item.name}
              </span>
            </div>
            {gridSize !== "sm" && !item.hasVariants && !item.isAgrupador && item.sku && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(item.sku)
                }}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono hover:text-foreground transition-colors group w-fit"
              >
                <span>SKU: {item.sku}</span>
                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          {/* Marca Column */}
          <div
            className={`col-span-2 h-full flex items-center justify-center border-r bg-white ${
              item.hasVariants || item.isAgrupador ? "border-border" : "border-border"
            } px-4`}
          >
            <span
              className={`${gridSize === "sm" ? "text-sm" : "text-sm"} ${
                item.hasVariants || item.isAgrupador ? "text-container-item-foreground" : "text-foreground"
              }`}
            >
              {item.marca || "-"}
            </span>
          </div>

          {/* Categoría Column */}
          <div
            className={`col-span-2 h-full flex items-center justify-center border-r bg-white ${
              item.hasVariants || item.isAgrupador ? "border-border" : "border-border"
            } px-4`}
          >
            <span
              className={`${gridSize === "sm" ? "text-sm" : "text-sm"} ${
                item.hasVariants || item.isAgrupador ? "text-container-item-foreground" : "text-foreground"
              }`}
            >
              {item.categoria || "-"}
            </span>
          </div>

          {/* Atributos Column */}
          {item.hasVariants ? (
            <div
              className={`col-span-3 h-full flex items-center justify-center border-r bg-white ${
                item.hasVariants || item.isAgrupador ? "border-border" : "border-border"
              } px-4`}
            >
              <span
                className={`${gridSize === "sm" ? "text-sm" : "text-sm"} ${
                  item.hasVariants || item.isAgrupador ? "text-container-item-foreground" : "text-foreground"
                }`}
              >
                Item con variantes
              </span>
            </div>
          ) : item.isAgrupador ? (
            <div
              className={`col-span-3 h-full flex items-center justify-center border-r bg-white ${
                item.hasVariants || item.isAgrupador ? "border-border" : "border-border"
              } px-4`}
            >
              <span
                className={`${gridSize === "sm" ? "text-sm" : "text-sm"} ${
                  item.hasVariants || item.isAgrupador ? "text-container-item-foreground" : "text-foreground"
                }`}
              >
                Grupo
              </span>
            </div>
          ) : (
            <div
              className="col-span-3 h-full flex items-center border-r border-border bg-white px-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onItemClick(item, "atributos")
              }}
            >
              {item.atributosPrincipales && item.atributosPrincipales.length > 0 ? (
                <>
                  {gridSize === "sm" ? (
                    <div className="grid grid-cols-2 gap-x-4 w-full">
                      {item.atributosPrincipales.slice(0, 2).map((attr, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm text-muted-foreground shrink-0">{attr.key}:</span>
                          <span className="text-sm text-foreground truncate" title={attr.value || "-"}>
                            {attr.value || "-"}
                          </span>
                        </div>
                      ))}
                      {item.atributosPrincipales.length === 1 && (
                        <div className="flex items-center">
                          <span className="text-sm text-muted-foreground">-</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {item.atributosPrincipales.map((attr, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide truncate w-full text-center">
                            {attr.key}
                          </span>
                          <span
                            className="text-sm text-foreground truncate w-full text-center"
                            title={attr.value || "-"}
                          >
                            {attr.value || "-"}
                          </span>
                        </div>
                      ))}
                      {item.atributosPrincipales.length === 1 && (
                        <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
                          <span className="text-sm text-muted-foreground">-</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {gridSize === "sm" ? (
                    <div className="grid grid-cols-2 gap-x-4 w-full">
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground">-</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground">-</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center gap-0.5 flex-1">
                        <span className="text-sm text-muted-foreground">-</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 flex-1">
                        <span className="text-sm text-muted-foreground">-</span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Stock Column */}
          {item.hasVariants ? (
            <div className="col-span-3 h-full flex items-center justify-center bg-white px-4">
              <span
                className={`${gridSize === "sm" ? "text-sm" : "text-sm"} ${
                  item.hasVariants || item.isAgrupador ? "text-container-item-foreground/80" : "text-muted-foreground"
                }`}
              >
                {item.variantCount} variantes
              </span>
            </div>
          ) : item.isAgrupador ? (
            <div className="col-span-3 h-full flex items-center justify-center bg-white px-4">
              <span
                className={`${gridSize === "sm" ? "text-sm" : "text-sm"} ${
                  item.hasVariants || item.isAgrupador ? "text-container-item-foreground/80" : "text-muted-foreground"
                }`}
              >
                {item.itemCount} items
              </span>
            </div>
          ) : (
            <div
              className="col-span-3 h-full flex items-center bg-white px-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onItemClick(item, "stock")
              }}
            >
              {gridSize === "sm" ? (
                <div className="grid grid-cols-3 gap-x-3 w-full">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-muted-foreground shrink-0">T:</span>
                    <span className="text-sm text-foreground">{item.stock?.total || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-muted-foreground shrink-0">R:</span>
                    <span className="text-sm text-foreground">{item.stock?.reservado || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-muted-foreground shrink-0">D:</span>
                    <span className="text-sm text-foreground">{item.stock?.disponible || 0}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-0.5 flex-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</span>
                    <span className="text-sm text-foreground">{item.stock?.total || 0}</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 flex-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Reservado</span>
                    <span className="text-sm text-foreground">{item.stock?.reservado || 0}</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 flex-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Disponible</span>
                    <span className="text-sm text-foreground">{item.stock?.disponible || 0}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  if (onDelete) {
                    onDelete(item)
                  }
                }}
                className="text-destructive hover:text-destructive/90"
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              onDelete={onDelete}
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
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
