"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { ChevronDown, ChevronUp, MoreVertical, Layers, Trash2, Copy, Minus } from "lucide-react"
import type { Item } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getCategoryImage } from "@/lib/utils/category-images"

interface ItemCardProps {
  item: Item
  index: number
  gridSize: string
  isSelected: boolean
  isIndeterminate?: boolean
  isExpanded: boolean
  onSelectClick: () => void
  onItemClick: (item: Item) => void
  onToggleExpansion: (index: number) => void
  onDelete?: (item: Item) => void
  nextItem?: Item
  isChild?: boolean
  isLastChild?: boolean
  handleItemSelection?: (item: Item, isChild?: boolean) => void
  getSelectionState?: (item: Item, isChild?: boolean) => { checked: boolean; indeterminate: boolean }
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
  isIndeterminate = false,
  isExpanded,
  onSelectClick,
  onItemClick,
  onToggleExpansion,
  onDelete,
  nextItem,
  isChild = false,
  isLastChild = false,
  handleItemSelection,
  getSelectionState,
}: ItemCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const [copiedSku, setCopiedSku] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const variantCount = useMemo(() => {
    return item.variantCount || item.variants?.length || 0
  }, [item.variantCount, item.variants])

  const itemCount = useMemo(() => {
    return item.itemCount || item.items?.length || 0
  }, [item.itemCount, item.items])

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
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
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
  }

  const handleButtonMouseLeave = () => {
    if (!isHovered) {
      setShowTransition(false)
    }
  }

  const handleCopySku = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(item.sku)
    setCopiedSku(true)
    setTimeout(() => setCopiedSku(false), 2000)
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
            onSelectClick()
          }}
        >
          {isIndeterminate ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelectClick()
              }}
              className={`relative left-[-7px] h-4.5 w-4.5 flex items-center justify-center rounded-sm bg-primary border border-primary cursor-pointer ${
                !isHovered && !isSelected && !isIndeterminate ? "opacity-0" : "opacity-100"
              } ${showTransition ? "transition-opacity" : ""}`}
            >
              <Minus className="w-3 h-3 text-primary-foreground" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelectClick()
              }}
              className={`relative left-[-7px] h-4.5 w-4.5 transition-colors cursor-pointer flex items-center justify-center text-sidebar-accent rounded-full ml-0 border shadow-xs border-slate-300 ${
                isSelected ? "bg-sky-950 border-primary hover:opacity-90" : "bg-transparent border-border"
              } ${!isHovered && !isSelected ? "opacity-0" : "opacity-100"} ${showTransition ? "transition-opacity" : ""}`}
            ></button>
          )}
        </div>

        <div
          className={`flex-1 border-solid mb-0 border-slate-200/65 shadow-md ${gridSize === "lg" ? "h-22" : gridSize === "md" ? "h-16" : "h-10"} ${roundedClass} grid ${
            item.isAgrupador || item.hasVariants
              ? `grid-cols-22 ${isHovered ? "bg-gray-50" : "bg-white"} border border-border transition-colors cursor-pointer overflow-hidden`
              : `grid-cols-22 ${isHovered ? "bg-gray-50" : "bg-white"} border border-border transition-colors overflow-hidden`
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
                className={`col-span-8 flex items-center gap-3 h-full px-4 cursor-pointer transition-colors border-slate-100 border-r-0`}
                onClick={(e) => {
                  e.stopPropagation()
                  onItemClick(item)
                }}
              >
                {/* Product Thumbnail with category-based image */}
                <div className="w-12 h-12 flex-shrink-0 rounded-md bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                  <img
                    src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                    alt={item.categoria || "Product"}
                    className="w-8 h-8 object-contain opacity-60"
                  />
                </div>

                {/* Product Info with POS styling */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`${gridSize === "sm" ? "text-sm" : "text-sm"} text-container-item-foreground font-medium truncate`}
                    >
                      {item.name}
                    </span>
                    {(item.hasVariants || item.isAgrupador) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">
                        {item.hasVariants ? `${variantCount} var.` : `${itemCount} items`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.marca && <span className="text-xs text-muted-foreground">{item.marca}</span>}
                    {item.marca && <span className="text-xs text-muted-foreground">·</span>}
                    {item.categoria && <span className="text-xs text-muted-foreground">{item.categoria}</span>}
                    {item.categoria && <span className="text-xs text-muted-foreground">·</span>}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{item.sku}</span>
                      <button
                        onClick={handleCopySku}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy SKU"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chevron on the right for parent items */}
              <div
                className={`col-span-14 h-full flex items-center justify-end px-4 cursor-pointer`}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleExpansion(index)
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleExpansion(index)
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                className={`col-span-8 flex items-center gap-3 h-full border-r border-slate-100 ${
                  item.hasVariants || item.isAgrupador ? "border-border" : "border-border"
                } ${isChild ? "pl-6 pr-4" : "px-4"} cursor-pointer transition-colors`}
                onClick={(e) => {
                  e.stopPropagation()
                  onItemClick(item)
                }}
              >
                {/* Product Thumbnail with category-based image - smaller for children */}
                <div className={`${isChild ? "w-9 h-9" : "w-12 h-12"} flex-shrink-0 rounded-md bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden`}>
                  <img
                    src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                    alt={item.categoria || "Product"}
                    className={`${isChild ? "w-6 h-6" : "w-8 h-8"} object-contain opacity-60`}
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`${gridSize === "sm" ? "text-sm" : "text-sm"} ${
                        isChild
                          ? "text-muted-foreground"
                          : item.hasVariants || item.isAgrupador
                            ? "text-container-item-foreground"
                            : "text-foreground"
                      } font-medium truncate`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.marca && <span className="text-xs text-muted-foreground">{item.marca}</span>}
                    {item.marca && <span className="text-xs text-muted-foreground">·</span>}
                    {item.categoria && <span className="text-xs text-muted-foreground">{item.categoria}</span>}
                    {item.categoria && <span className="text-xs text-muted-foreground">·</span>}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{item.sku}</span>
                      <button
                        onClick={handleCopySku}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy SKU"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`col-span-7 h-full flex items-center px-4 cursor-pointer transition-colors border-r border-slate-100`}
                onClick={(e) => {
                  e.stopPropagation()
                  onItemClick(item)
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
                  <div className="flex items-center justify-center w-full">
                    <span className="w-8 h-px bg-slate-200 rounded-full"></span>
                  </div>
                )}
              </div>

              {item.hasVariants ? (
                <div className="col-span-7 h-full flex items-center justify-center px-4">
                  <span className="text-sm text-container-item-foreground/80">{variantCount} variantes</span>
                </div>
              ) : item.isAgrupador ? (
                <div className="col-span-7 h-full flex items-center justify-center px-4">
                  <span className="text-sm text-container-item-foreground/80">{itemCount} items</span>
                </div>
              ) : (
                <div
                  className="col-span-7 h-full flex items-center px-4 cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log("[v0] ItemCard clicked - isChild:", isChild, "item:", item)
                    onItemClick(item)
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
          className={`flex items-center gap-2 px-3 ${!isHovered ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
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
                  onDelete?.(item)
                }}
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
          {item.variants.map((variant: any, variantIndex: number) => {
            const childState = getSelectionState ? getSelectionState(variant, true) : { checked: false, indeterminate: false }
            return (
              <ItemCard
                key={variant.sku || variantIndex}
                item={variant}
                index={variantIndex}
                gridSize={gridSize}
                isSelected={childState.checked}
                isIndeterminate={childState.indeterminate}
                isExpanded={false}
                onSelectClick={() => handleItemSelection?.(variant, true)}
                onItemClick={onItemClick}
                onToggleExpansion={() => {}}
                onDelete={onDelete}
                nextItem={item.variants?.[variantIndex + 1]}
                isChild={true}
                isLastChild={variantIndex === item.variants.length - 1}
                handleItemSelection={handleItemSelection}
                getSelectionState={getSelectionState}
              />
            )
          })}
        </div>
      )}

      {item.isAgrupador && isExpanded && item.items && (
        <div className={gridSize === "lg" ? "mt-2" : "mt-0"}>
          {item.items.map((groupItem, groupItemIndex) => {
            const childState = getSelectionState ? getSelectionState(groupItem, true) : { checked: false, indeterminate: false }
            return (
              <ItemCard
                key={groupItem.sku || groupItemIndex}
                item={groupItem}
                index={groupItemIndex}
                gridSize={gridSize}
                isSelected={childState.checked}
                isIndeterminate={childState.indeterminate}
                isExpanded={false}
                onSelectClick={() => handleItemSelection?.(groupItem, true)}
                onItemClick={onItemClick}
                onToggleExpansion={() => {}}
                onDelete={onDelete}
                nextItem={item.items?.[groupItemIndex + 1]}
                isChild={true}
                isLastChild={groupItemIndex === item.items.length - 1}
                handleItemSelection={handleItemSelection}
                getSelectionState={getSelectionState}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
