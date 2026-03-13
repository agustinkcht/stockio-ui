"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { ChevronDown, ChevronUp, MoreVertical, Layers, Trash2, Copy, Minus, Plus, Check } from "lucide-react"
import type { Item } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getCategoryImage } from "@/lib/utils/category-images"

interface AuditStockChange {
  total: number
  reservado: number
}

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
  isAuditMode?: boolean
  onStockChange?: (sku: string, field: "total" | "reservado", value: number) => void
  auditStockValues?: Record<string, AuditStockChange>
  showPrecioColumn?: boolean
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
  isAuditMode = false,
  onStockChange,
  auditStockValues,
  showPrecioColumn = false,
}: ItemCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const [copiedSku, setCopiedSku] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Audit mode stock modification state
  const [stockTotalOperation, setStockTotalOperation] = useState<"agregar" | "disminuir" | "sobreescribir">("agregar")
  const [stockTotalInput, setStockTotalInput] = useState("")
  const [stockReservadoOperation, setStockReservadoOperation] = useState<"agregar" | "disminuir" | "sobreescribir">("agregar")
  const [stockReservadoInput, setStockReservadoInput] = useState("")

  // Get current stock values (use audit values if available, otherwise original)
  const currentStockTotal = auditStockValues?.[item.sku]?.total ?? parseInt(item.stock?.total || "0")
  const currentStockReservado = auditStockValues?.[item.sku]?.reservado ?? parseInt(item.stock?.reservado || "0")
  const currentStockDisponible = currentStockTotal - currentStockReservado
  const hasAuditChange = auditStockValues && item.sku in auditStockValues

  // Handle stock modification
  const handleStockModify = (type: "total" | "reservado") => {
    const operation = type === "total" ? stockTotalOperation : stockReservadoOperation
    const inputValue = parseInt(type === "total" ? stockTotalInput : stockReservadoInput)
    
    if (isNaN(inputValue) || inputValue < 0) return
    
    const currentValue = type === "total" ? currentStockTotal : currentStockReservado
    let newValue = currentValue
    
    if (operation === "agregar") {
      newValue = currentValue + inputValue
    } else if (operation === "disminuir") {
      newValue = Math.max(0, currentValue - inputValue)
    } else if (operation === "sobreescribir") {
      newValue = inputValue
    }
    
    onStockChange?.(item.sku, type, newValue)
    
    // Clear input after applying
    if (type === "total") {
      setStockTotalInput("")
    } else {
      setStockReservadoInput("")
    }
  }

  // Handle increment/decrement buttons
  const handleStockIncrement = (type: "total" | "reservado", delta: number) => {
    const currentValue = type === "total" ? currentStockTotal : currentStockReservado
    const newValue = Math.max(0, currentValue + delta)
    onStockChange?.(item.sku, type, newValue)
  }

  // Calculate preview value based on operation and input
  const getPreviewValue = (type: "total" | "reservado"): number => {
    const operation = type === "total" ? stockTotalOperation : stockReservadoOperation
    const inputStr = type === "total" ? stockTotalInput : stockReservadoInput
    const inputValue = parseInt(inputStr)
    const currentValue = type === "total" ? currentStockTotal : currentStockReservado
    
    if (isNaN(inputValue) || inputStr === "") {
      return currentValue
    }
    
    if (operation === "agregar") {
      return currentValue + inputValue
    } else if (operation === "disminuir") {
      return Math.max(0, currentValue - inputValue)
    } else {
      return inputValue
    }
  }

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
            isAuditMode
              ? `grid-cols-22 ${
                  hasAuditChange 
                    ? "bg-amber-50/50 border-amber-300/50" 
                    : isHovered 
                      ? "bg-gray-50" 
                      : "bg-white"
                } border border-border transition-colors ${item.isAgrupador || item.hasVariants ? "cursor-pointer" : ""} overflow-hidden`
              : item.isAgrupador || item.hasVariants
                ? `grid-cols-44 ${isHovered ? "bg-gray-50" : "bg-white"} border border-border transition-colors cursor-pointer overflow-hidden`
                : `grid-cols-44 ${isHovered ? "bg-gray-50" : "bg-white"} border border-border transition-colors overflow-hidden`
          }`}
          onClick={(e) => {
            if (item.hasVariants || item.isAgrupador) {
              onToggleExpansion(index)
            }
          }}
        >
          {isAuditMode ? (
            // AUDIT MODE LAYOUT
            item.isAgrupador || item.hasVariants ? (
              // Parent items in audit mode - show item info + chevron (same as normal mode)
              <>
                {/* Item cell - col-span-16, container icon */}
                <div
                  className={`col-span-16 flex items-center gap-3 h-full px-4 cursor-pointer transition-colors border-r border-slate-100`}
                  onClick={(e) => { e.stopPropagation(); onItemClick(item) }}
                >
                  <div className="w-8 h-8 flex-shrink-0 rounded-md bg-slate-100 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground font-medium truncate">{item.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">
                        {item.hasVariants ? `${variantCount} var.` : `${itemCount} items`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.marca && <span className="text-xs text-muted-foreground">{item.marca}</span>}
                      {item.marca && <span className="text-xs text-muted-foreground">·</span>}
                      <span className="text-xs text-muted-foreground">{item.sku}</span>
                    </div>
                  </div>
                </div>

                {/* Categoría cell */}
                <div
                  className="col-span-7 h-full flex items-center justify-center px-4 border-r border-slate-100 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
                >
                  <span className="text-sm text-foreground">{item.categoria || "-"}</span>
                </div>

                {/* Precio Final cell - empty for parent */}
                <div
                  className="col-span-7 h-full flex items-center justify-center px-4 border-r border-slate-100 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
                >
                  <span className="w-4 h-px bg-slate-200 rounded-full block" />
                </div>

                {/* Stock cell - empty with chevron at right edge */}
                <div
                  className="col-span-14 h-full flex items-center justify-end px-4 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </>
            ) : (
              // Standalone and children items in audit mode - with stock modification controls
              <>
                <div
                  className={`col-span-8 flex items-center gap-3 h-full border-r border-slate-100/50 ${isChild ? "pl-6 pr-4" : "px-4"} cursor-pointer transition-colors`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onItemClick(item)
                  }}
                >
                  {/* Product Thumbnail */}
                  <div className={`${isChild ? "w-9 h-9" : "w-12 h-12"} flex-shrink-0 rounded-md bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden`}>
                    <img
                      src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                      alt={item.categoria || "Product"}
                      className={`${isChild ? "w-6 h-6" : "w-8 h-8"} object-contain opacity-60`}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground font-medium truncate">
                        {item.name}
                      </span>
                      {/* Atributos principales tags for child items in audit mode */}
                      {isChild && item.atributosPrincipales && item.atributosPrincipales.length > 0 && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {item.atributosPrincipales.map((attr, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap"
                            >
                              {attr.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.marca && <span className="text-xs text-muted-foreground">{item.marca}</span>}
                      {item.marca && <span className="text-xs text-muted-foreground">·</span>}
                      {item.categoria && <span className="text-xs text-muted-foreground">{item.categoria}</span>}
                      {item.categoria && <span className="text-xs text-muted-foreground">·</span>}
                      <span className="text-xs text-muted-foreground">{item.sku}</span>
                    </div>
                  </div>
                </div>

                {/* Stock Total - 6 cols with modification controls */}
                <div className="col-span-6 h-full flex items-center justify-center gap-1 px-1.5 border-r border-slate-100/50">
                  {/* Operation selector */}
                  <select
                    value={stockTotalOperation}
                    onChange={(e) => setStockTotalOperation(e.target.value as "agregar" | "disminuir" | "sobreescribir")}
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 text-[10px] px-1 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
                  >
                    <option value="agregar">Aumentar</option>
                    <option value="disminuir">Disminuir</option>
                    <option value="sobreescribir">Sobreescribir</option>
                  </select>
                  {/* Input field */}
                  <input
                    type="number"
                    min="0"
                    value={stockTotalInput}
                    onChange={(e) => setStockTotalInput(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="0"
                    className="w-10 h-6 text-xs text-center border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-400 mr-0"
                  />
                  {/* Check button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStockModify("total")
                    }}
                    disabled={!stockTotalInput}
                    className={`p-1 rounded transition-all duration-200 mr-4 ${
                      stockTotalInput 
                        ? "bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer" 
                        : "bg-slate-100 text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  {/* -/+ buttons around value */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStockIncrement("total", -1)
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-sm font-semibold text-foreground min-w-[24px] text-center">{currentStockTotal}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStockIncrement("total", 1)
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Stock Reservado - 6 cols with modification controls */}
                <div className="col-span-6 h-full flex items-center justify-center gap-1 px-1.5 border-r border-slate-100/50">
                  {/* Operation selector */}
                  <select
                    value={stockReservadoOperation}
                    onChange={(e) => setStockReservadoOperation(e.target.value as "agregar" | "disminuir" | "sobreescribir")}
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 text-[10px] px-1 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
                  >
                    <option value="agregar">Aumentar</option>
                    <option value="disminuir">Disminuir</option>
                    <option value="sobreescribir">Sobreescribir</option>
                  </select>
                  {/* Input field */}
                  <input
                    type="number"
                    min="0"
                    value={stockReservadoInput}
                    onChange={(e) => setStockReservadoInput(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="0"
                    className="w-10 h-6 text-xs text-center border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                  {/* Check button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStockModify("reservado")
                    }}
                    disabled={!stockReservadoInput}
                    className={`p-1 rounded transition-all duration-200 mr-4 ${
                      stockReservadoInput 
                        ? "bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer" 
                        : "bg-slate-100 text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  {/* -/+ buttons around value */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStockIncrement("reservado", -1)
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-sm font-semibold text-foreground min-w-[24px] text-center">{currentStockReservado}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStockIncrement("reservado", 1)
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Stock Disponible - 2 cols (read-only) */}
                <div className="col-span-2 h-full flex items-center justify-center px-2">
                  <span className={`text-sm font-semibold font-mono ${
                    currentStockDisponible > 0 
                      ? "text-emerald-600" 
                      : currentStockDisponible < 0 
                        ? "text-red-500" 
                        : "text-foreground"
                  }`}>
                    {currentStockDisponible}
                  </span>
                </div>
              </>
            )
          ) : item.isAgrupador || item.hasVariants ? (
            // NORMAL MODE: Parent items
            <>
              {/* Item cell - col-span-16, no thumbnail, container icon instead */}
              <div
                className={`col-span-16 flex items-center gap-3 h-full px-4 cursor-pointer transition-colors border-r border-slate-100`}
                onClick={(e) => {
                  e.stopPropagation()
                  onItemClick(item)
                }}
              >
                {/* Container icon instead of thumbnail */}
                <div className="flex-shrink-0 rounded-md flex items-center justify-center size-12 bg-transparent">
                  <Layers className="size-4 text-blue-900" />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-container-item-foreground font-medium truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">
                      {item.hasVariants ? `${variantCount} var.` : `${itemCount} items`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.marca && <span className="text-xs text-muted-foreground">{item.marca}</span>}
                    {item.marca && <span className="text-xs text-muted-foreground">·</span>}
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

              {/* Categoría cell */}
              <div
                className="col-span-7 h-full flex items-center justify-center px-4 border-r border-slate-100 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
              >
                <span className="text-sm text-foreground">{item.categoria || "-"}</span>
              </div>

              {/* Estado cell */}
              <div
                className="col-span-7 h-full flex items-center justify-center px-4 border-r border-slate-100 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
              >
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 border-none">
                  Activo
                </span>
              </div>

              {/* Precio Final - blank for parent */}
              <div
                className="col-span-7 h-full flex items-center justify-center px-4 cursor-pointer border-r-0 border-none"
                onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
              >
              </div>

              {/* Stock Disponible - blank for parent, chevron at right edge */}
              <div
                className="col-span-7 h-full flex items-center justify-end px-4 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </>
          ) : (
            // NORMAL MODE: Standalone/child items
            <>
              <div
                className={`col-span-16 flex items-center gap-3 h-full border-r border-slate-100 ${
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
                    {/* Atributos principales tags for child items */}
                    {isChild && item.atributosPrincipales && item.atributosPrincipales.length > 0 && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {item.atributosPrincipales.map((attr, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap bg-blue-50 text-blue-900 border-blue-100 border border-none"
                          >
                            {attr.value}
                          </span>
                        ))}
                      </div>
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

              {showPrecioColumn ? (
                <>
                  {/* Categoría cell */}
                  <div
                    className="col-span-7 h-full flex items-center px-4 cursor-pointer transition-colors border-r border-slate-100"
                    onClick={(e) => { e.stopPropagation(); onItemClick(item) }}
                  >
                    <span className="text-sm text-foreground truncate w-full text-center">{item.categoria || "-"}</span>
                  </div>
                  {/* Estado cell */}
                  <div
                    className="col-span-7 h-full flex items-center justify-center px-4 cursor-pointer transition-colors border-r border-slate-100"
                    onClick={(e) => { e.stopPropagation(); onItemClick(item) }}
                  >
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 border-none">
                      Activo
                    </span>
                  </div>
                  {/* Precio Final cell */}
                  <div
                    className="col-span-7 h-full flex items-center px-4 cursor-pointer transition-colors border-r border-slate-100"
                    onClick={(e) => { e.stopPropagation(); onItemClick(item) }}
                  >
                    <div className="w-full flex flex-col items-center gap-0.5">
                      <span className="text-sm text-foreground font-medium w-full text-center">
                        ${(item.precio?.precioFinal || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                // Show Atributos column: original behavior
                <div
                  className="col-span-14 h-full flex items-center px-4 cursor-pointer transition-colors border-r border-slate-100"
                  onClick={(e) => { e.stopPropagation(); onItemClick(item) }}
                >
                  {item.atributosPrincipales && item.atributosPrincipales.length > 0 ? (
                    <>
                      {gridSize === "sm" ? (
                        <div className={item.atributosPrincipales.length === 1 ? "w-full" : "grid grid-cols-2 gap-x-4 w-full"}>
                          {item.atributosPrincipales.slice(0, 2).map((attr, idx) => (
                            <div key={idx} className={item.atributosPrincipales.length === 1 ? "flex items-center justify-center gap-1.5" : "flex items-center gap-1.5 min-w-0"}>
                              <span className="text-sm text-muted-foreground shrink-0">{attr.key}:</span>
                              <span className="text-sm text-foreground truncate" title={attr.value || "-"}>{attr.value || "-"}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={item.atributosPrincipales.length === 1 ? "flex items-center justify-center" : "flex"} style={{ width: "100%" }}>
                          {item.atributosPrincipales.map((attr, idx) => (
                            <div key={idx} className={item.atributosPrincipales.length === 1 ? "flex flex-col items-center gap-0.5" : "flex flex-col items-center gap-0.5 flex-1 min-w-0"}>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wide truncate w-full text-center">{attr.key}</span>
                              <span className="text-sm text-foreground truncate w-full text-center" title={attr.value || "-"}>{attr.value || "-"}</span>
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
              )}

              {item.hasVariants ? (
                <div className="col-span-7 h-full flex items-center justify-center px-4">
                  <span className="text-sm text-container-item-foreground/80">{variantCount} var.</span>
                </div>
              ) : item.isAgrupador ? (
                <div className="col-span-7 h-full flex items-center justify-center px-4">
                  <span className="text-sm text-container-item-foreground/80">{itemCount} items</span>
                </div>
              ) : (
                <div
                  className="col-span-7 h-full flex items-center justify-center px-4 cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    onItemClick(item)
                  }}
                >
                  <span className={`text-sm font-medium tabular-nums ${
                    (item.stock?.disponible ?? 0) > 0
                      ? "text-foreground"
                      : (item.stock?.disponible ?? 0) < 0
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }`}>
                    {item.stock?.disponible ?? 0}
                  </span>
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
                isAuditMode={isAuditMode}
                onStockChange={onStockChange}
                auditStockValues={auditStockValues}
                showPrecioColumn={showPrecioColumn}
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
                isAuditMode={isAuditMode}
                onStockChange={onStockChange}
                auditStockValues={auditStockValues}
                showPrecioColumn={showPrecioColumn}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
