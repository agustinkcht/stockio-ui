"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, ChevronRight, Copy, MoreVertical, Layers, DollarSign, Trash2 } from "lucide-react"
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
  nextItem?: Item // Added for dynamic margin calculation
  isChild?: boolean // Added to identify child items
  isLastChild?: boolean // Added to identify last child for rounded bottom corners
}

function calculateMarginBottom(currentItem: Item, nextItem: Item | undefined, isChild: boolean): string {
  // Children have no margin between them
  if (isChild) {
    return "mb-0"
  }

  // If there's no next item, no margin needed
  if (!nextItem) {
    return "mb-0"
  }

  const isCurrentParent = currentItem.isAgrupador || currentItem.hasVariants
  const isNextParent = nextItem.isAgrupador || nextItem.hasVariants

  // Parent → Parent or Parent → Standalone: 8px (mb-2)
  if (isCurrentParent) {
    return "mb-[5px]"
  }

  // Standalone → Parent: 5px
  if (!isCurrentParent && isNextParent) {
    return "mb-[5px]"
  }

  // Standalone → Standalone: 5px
  return "mb-[5px]"
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
  const [isDebounced, setIsDebounced] = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const marginClass = calculateMarginBottom(item, nextItem, isChild)

  const getRoundedClass = () => {
    const isParent = item.isAgrupador || item.hasVariants

    if (isChild) {
      // Last child gets rounded bottom corners
      if (isLastChild) {
        return "rounded-b-sm"
      }
      // Other children have no rounded corners
      return ""
    }

    if (isParent) {
      if (isExpanded) {
        // Expanded parent: only rounded top corners
        return "rounded-t-sm"
      }
      // Collapsed parent: all corners rounded
      return "rounded-sm"
    }

    // Standalone items: all corners rounded
    return "rounded-sm"
  }

  const roundedClass = getRoundedClass()

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const handleMouseEnter = () => {
    setIsHovered(true)
    setShowTransition(true)
    hoverTimeoutRef.current = setTimeout(() => {
      setIsDebounced(true)
    }, 900)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setIsDebounced(false)
    setShowTransition(true)
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
  }

  const handleButtonMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setShowTransition(false)
    setIsDebounced(true)
  }

  const handleButtonMouseLeave = () => {
    if (!isHovered) {
      setIsDebounced(false)
      setShowTransition(false)
    }
  }

  return (
    <div className={marginClass}>
      <div
        className="flex items-center gap-2 bg-transparent mb-0 mt-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="p-2 -m-2 cursor-pointer py-4 pl-2"
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
          onClick={(e) => {
            e.stopPropagation()
            onSelectClick(index)
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelectClick(index)
            }}
            className={`relative left-[-7px] h-4.5 w-4.5 transition-colors cursor-pointer flex items-center justify-center text-sidebar-accent rounded-full ml-0 border shadow-xs border-slate-300 ${
              isSelected ? "bg-sky-950 border-primary hover:opacity-90" : "bg-transparent border-border"
            } ${!isDebounced && !isSelected ? "opacity-0" : "opacity-100"} ${showTransition ? "transition-opacity" : ""}`}
          ></button>
        </div>

        <div
          // 22 - 14 - 9 / 22 - 16 - 10
          className={`flex-1 border-solid mb-0 border-slate-200/65 shadow-md ${gridSize === "lg" ? "h-22" : gridSize === "md" ? "h-16" : "h-10"} ${roundedClass} grid ${
            item.isAgrupador || item.hasVariants
              ? `grid-cols-14 bg-white border border-border hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden`
              : "grid-cols-14 bg-white border border-border overflow-hidden"
          }`}
          onClick={(e) => {
            if (item.hasVariants || item.isAgrupador) {
              onToggleExpansion(index)
            }
          }}
        >
          {item.isAgrupador || item.hasVariants ? (
            <>
              <div
                className={`col-span-4 flex flex-col justify-center h-full bg-white px-4 cursor-pointer transition-colors hover:bg-gray-50 border-r border-slate-100`}
                onClick={(e) => {
                  e.stopPropagation()
                  onItemClick(item, "info", true)
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
                    className={`${gridSize === "sm" ? "text-sm" : "text-sm"} text-container-item-foreground font-medium`}
                  >
                    {item.name}
                  </span>
                </div>
              </div>

              <div
                className={`col-span-2 h-full flex items-center justify-center bg-white px-4 border-r border-slate-100`}
              >
                <span className="text-sm text-card-foreground">{item.marca || "-"}</span>
              </div>

              <div
                className={`col-span-2 h-full flex items-center justify-center bg-white px-4 border-r border-slate-100`}
              >
                <span className="text-sm text-card-foreground">{item.categoria || "-"}</span>
              </div>

              <div
                className={`col-span-3 h-full flex items-center justify-center bg-white border-r border-slate-100 ${
                  item.hasVariants || item.isAgrupador ? "border-border" : "border-border"
                } px-4`}
              ></div>
            </>
          ) : (
            <>
              <div
                className={`col-span-4 flex flex-col justify-center h-full border-r bg-white border-slate-100 ${
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
                {isChild ? (
                  item.sku && (
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
                  )
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className={`${gridSize === "sm" ? "text-sm" : "text-sm"} ${
                        item.hasVariants || item.isAgrupador
                          ? "text-container-item-foreground font-medium"
                          : "text-foreground font-medium"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                )}
                {!isChild && gridSize !== "sm" && !item.hasVariants && !item.isAgrupador && item.sku && (
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

              <div
                className={`col-span-2 h-full flex items-center justify-center border-r bg-white border-slate-100 ${
                  item.hasVariants || item.isAgrupador ? "border-border" : "border-border"
                } px-4`}
              >
                <span
                  className={`${gridSize === "sm" ? "text-sm" : "text-sm"} ${
                    isChild
                      ? "text-muted-foreground"
                      : item.hasVariants || item.isAgrupador
                        ? "text-container-item-foreground"
                        : "text-foreground"
                  }`}
                >
                  {item.marca || "-"}
                </span>
              </div>

              <div
                className={`col-span-2 h-full flex items-center justify-center border-r bg-white border-slate-100 ${
                  item.hasVariants || item.isAgrupador ? "border-border" : "border-border"
                } px-4`}
              >
                <span
                  className={`${gridSize === "sm" ? "text-sm" : "text-sm"} ${
                    isChild
                      ? "text-muted-foreground"
                      : item.hasVariants || item.isAgrupador
                        ? "text-container-item-foreground"
                        : "text-foreground"
                  }`}
                >
                  {item.categoria || "-"}
                </span>
              </div>

              <div
                className="col-span-3 h-full flex items-center bg-white px-4 cursor-pointer hover:bg-gray-50 transition-colors border-r border-slate-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onItemClick(item, "atributos")
                }}
              >
                {item.atributosPrincipales && item.atributosPrincipales.length > 0 ? (
                  <>
                    {gridSize === "sm" ? (
                      <div
                        className={
                          item.atributosPrincipales.length === 1 ? "w-full" : "grid grid-cols-2 gap-x-4 w-full"
                        }
                      >
                        {item.atributosPrincipales.slice(0, 2).map((attr, idx) => (
                          <div
                            key={idx}
                            className={
                              item.atributosPrincipales.length === 1
                                ? "flex items-center justify-center gap-1.5"
                                : "flex items-center gap-1.5 min-w-0"
                            }
                          >
                            <span className="text-sm text-muted-foreground shrink-0">{attr.key}:</span>
                            <span className="text-sm text-foreground truncate" title={attr.value || "-"}>
                              {attr.value || "-"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={item.atributosPrincipales.length === 1 ? "flex items-center justify-center" : "flex"}
                        style={{ width: "100%" }}
                      >
                        {item.atributosPrincipales.map((attr, idx) => (
                          <div
                            key={idx}
                            className={
                              item.atributosPrincipales.length === 1
                                ? "flex flex-col items-center gap-0.5"
                                : "flex flex-col items-center gap-0.5 flex-1 min-w-0"
                            }
                          >
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
                      </div>
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

              {item.hasVariants ? (
                <div className="col-span-3 h-full flex items-center justify-center bg-white px-4">
                  <span className="text-sm text-container-item-foreground/80">{item.variantCount} variantes</span>
                </div>
              ) : item.isAgrupador ? (
                <div className="col-span-3 h-full flex items-center justify-center bg-white px-4">
                  <span className="text-sm text-container-item-foreground/80">{item.itemCount} items</span>
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
            </>
          )}
        </div>

        <div
          className={`flex items-center gap-2 px-3 ${!isDebounced ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-2 -m-2 py-4 px-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Implement agregar a colección functionality
                }}
              >
                <Layers className="w-4 h-4 mr-2" />
                Agregar a Colección
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Implement ver en listas de precio functionality
                }}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Ver en Listas de Precios
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  if (onDelete) {
                    onDelete(item)
                  }
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

      {item.hasVariants && isExpanded && item.variants && (
        <div className={gridSize === "lg" ? "mt-2" : "mt-0"}>
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
        <div className={gridSize === "lg" ? "mt-2" : "mt-0"}>
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
