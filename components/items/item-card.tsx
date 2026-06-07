"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { ChevronDown, ChevronUp, MoreVertical, Layers, Trash2, Copy, Minus, Plus, Check, X } from "lucide-react"
import type { Item } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getCategoryImage } from "@/lib/utils/category-images"
import { StockEditModal } from "@/components/modals/stock-edit-modal"
import { useSettings } from "@/lib/contexts/settings-context"

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
  parentItem?: Item // Parent item for children to compute full SKU
  handleItemSelection?: (item: Item, isChild?: boolean) => void
  getSelectionState?: (item: Item, isChild?: boolean) => { checked: boolean; indeterminate: boolean }
  isAuditMode?: boolean
  onStockChange?: (sku: string, field: "total" | "reservado", value: number) => void
  auditStockValues?: Record<string, AuditStockChange>
  showPrecioColumn?: boolean
  onUpdatePrecio?: (itemId: string, precio: { costo: number; margen: number; iva: number; precioFinal: number }) => void
  onUpdateStock?: (itemSku: string, field: "total" | "reservado", value: number) => void
  onUpdateItem?: (item: Item) => void
  stockViewMode?: boolean // When true, uses stock-specific grid layout (cols-22 with stock columns)
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
  parentItem,
  handleItemSelection,
  getSelectionState,
  isAuditMode = false,
  onStockChange,
  auditStockValues,
  showPrecioColumn = false,
  onUpdatePrecio,
  onUpdateStock,
  onUpdateItem,
  stockViewMode = false,
}: ItemCardProps) {
  const { stock } = useSettings()
  
  // Compute full SKU for children: {parentSkuPrefix}-{skuSuffix}
  // For standalone items, use sku directly
  // For parent items, display skuPrefix (the "sku padre")
  const displaySku = useMemo(() => {
    if (isChild) {
      // Child items: compute full SKU from parent's prefix + child's suffix
      const parentPrefix = parentItem?.skuPrefix || parentItem?.sku
      const childSuffix = item.skuSuffix || item.sku
      if (parentPrefix && childSuffix) {
        return `${parentPrefix}-${childSuffix}`
      }
      return childSuffix || ""
    }
    // Parent items: show skuPrefix (sku padre)
    if (item.hasVariants) {
      return item.skuPrefix || item.sku || ""
    }
    // Standalone items: show sku directly
    return item.sku || ""
  }, [isChild, parentItem?.skuPrefix, parentItem?.sku, item.skuSuffix, item.sku, item.hasVariants, item.skuPrefix])
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
  // Check by id first (for children/variants), then by sku (for standalone items)
  const itemKey = item.id || item.sku
  const currentStockTotal = auditStockValues?.[itemKey]?.total ?? parseInt((item.stock as any)?.enStock || item.stock?.total || "0")
  const currentStockReservado = auditStockValues?.[itemKey]?.reservado ?? parseInt(item.stock?.reservado || "0")
  const currentStockDisponible = currentStockTotal - currentStockReservado
  const hasAuditChange = auditStockValues && itemKey in auditStockValues

  // Compute if item is active
  // - For standalone/children: use item.isActive directly (defaults to true if undefined)
  // - For parents: active if at least one child is active
  const isItemActive = useMemo(() => {
    if (item.hasVariants && item.variants && item.variants.length > 0) {
      return item.variants.some((v) => (v as any).isActive !== false)
    }
    if (item.isAgrupador && item.items && item.items.length > 0) {
      return item.items.some((i) => (i as any).isActive !== false)
    }
    return item.isActive !== false
  }, [item])

  // Modal state for inline grid editing (precio and stock)
  const [isPrecioModalOpen, setIsPrecioModalOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [precioModalValues, setPrecioModalValues] = useState({
    costo: item.precio?.costo || 0,
    margen: item.precio?.margen || 0,
    iva: item.precio?.iva || 0,
    precioFinal: item.precio?.precioFinal || 0,
  })
  
  // Handle stock modal accept - updates both total and reservado at once
  const handleStockModalAccept = (newTotal: number, newReservado: number) => {
    const itemIdentifier = item.id || item.sku
    if (newTotal !== currentStockTotal) {
      onUpdateStock?.(itemIdentifier, "total", newTotal)
    }
    if (newReservado !== currentStockReservado) {
      onUpdateStock?.(itemIdentifier, "reservado", newReservado)
    }
  }

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
    
    // Use item.id for variants (children), fallback to sku for standalone items
    const itemIdentifier = item.id || item.sku
    onStockChange?.(itemIdentifier, type, newValue)
    
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
    // Use item.id for variants (children), fallback to sku for standalone items
    const itemIdentifier = item.id || item.sku
    onStockChange?.(itemIdentifier, type, newValue)
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
    await navigator.clipboard.writeText(displaySku)
    setCopiedSku(true)
    setTimeout(() => setCopiedSku(false), 2000)
  }

  return (
    <div className={marginClass}>
      <div
        className="relative bg-transparent mb-0 mt-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`relative border-solid mb-0 border-slate-200/65 shadow-md ${gridSize === "lg" ? "h-22" : gridSize === "md" ? "h-16" : "h-10"} ${roundedClass} grid ${
            isAuditMode
              ? `grid-cols-22 ${
                  hasAuditChange 
                    ? "bg-amber-50/50 border-amber-300/50" 
                    : isHovered 
                      ? "bg-gray-50" 
                      : "bg-white"
                } border border-border transition-colors ${item.isAgrupador || item.hasVariants ? "cursor-pointer" : ""} overflow-hidden`
              : stockViewMode
                ? `grid-cols-22 ${!isItemActive ? "bg-slate-100/80 opacity-60" : isHovered ? "bg-gray-50" : "bg-white"} border border-border transition-colors ${item.isAgrupador || item.hasVariants ? "cursor-pointer" : ""} overflow-hidden`
                : item.isAgrupador || item.hasVariants
                  ? `grid-cols-44 ${!isItemActive ? "bg-slate-100/80 opacity-60" : isHovered ? "bg-gray-50" : "bg-white"} border border-border transition-colors cursor-pointer overflow-hidden`
                  : `grid-cols-44 ${!isItemActive ? "bg-slate-100/80 opacity-60" : isHovered ? "bg-gray-50" : "bg-white"} border border-border transition-colors overflow-hidden`
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
              // Parent items in audit mode - chevron on left instead of thumbnail
              <>
                {/* Item cell - col-span-16, chevron on left */}
                <div
                  className={`col-span-16 flex items-center gap-3 h-full pl-10 pr-4 cursor-pointer transition-colors border-r border-slate-100`}
                  onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
                >
                  {/* Chevron instead of thumbnail - match thumbnail size w-12 h-12 */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
                    className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-md hover:bg-slate-100 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 min-w-0" onClick={(e) => { e.stopPropagation(); onItemClick(item) }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground font-medium truncate">{item.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">
                        {item.hasVariants ? `${variantCount} var.` : `${itemCount} items`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.marca && <span className="text-xs text-muted-foreground">{item.marca}</span>}
                    </div>
                  </div>
                </div>

                {/* Categoría cell */}
                <div
                  className="col-span-10 h-full flex items-center justify-center px-4 border-r border-slate-100 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
                >
                  <span className="text-sm text-foreground">{item.categoria || "-"}</span>
                </div>

                {/* Precio Final cell - empty for parent */}
                <div
                  className="col-span-10 h-full flex items-center justify-center px-4 border-r border-slate-100 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
                >
                </div>

                {/* Stock Disponible cell - empty for parent */}
                <div
                  className="col-span-8 h-full flex items-center justify-center px-4 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
                >
                </div>
              </>
            ) : (
              // Standalone and children items in audit mode - with stock modification controls
              <>
                <div
                  className="col-span-8 flex items-center gap-3 h-full border-r border-slate-100/50 px-4 cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    onItemClick(item)
                  }}
                >
  {/* Product Thumbnail - same container size, smaller image for children */}
                <div className="w-12 h-12 flex-shrink-0 rounded-md bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                  <img
                    src={getCategoryImage(item.categoria || parentItem?.categoria) || "/placeholder.svg"}
                    alt={item.categoria || parentItem?.categoria || "Product"}
                    className={`${isChild ? "w-7 h-7" : "w-8 h-8"} object-contain opacity-60`}
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
                    {!isChild && (
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.marca && <span className="text-xs text-muted-foreground">{item.marca}</span>}
                      </div>
                    )}
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
            // NORMAL MODE: Parent items - Item (16) + empty span (28), no borders between columns
            stockViewMode ? (
              // Stock View Mode: Item (8), Categoria (4), Total (4), Reservado (4), Disponible (2)
              <>
                <div
                  className="col-span-8 flex items-center gap-3 h-full pl-10 pr-4 cursor-pointer transition-colors border-r border-slate-100"
                  onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
                    className="flex-shrink-0 flex items-center justify-center size-6 rounded-md hover:bg-slate-100 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0" onClick={(e) => { e.stopPropagation(); onItemClick(item) }}>
                    <span className="text-sm text-container-item-foreground font-medium truncate block">{item.name}</span>
                    <span className="text-[10px] text-muted-foreground">{item.hasVariants ? `${variantCount} var.` : `${itemCount} items`}</span>
                  </div>
                </div>
                <div className="col-span-4 h-full flex items-center justify-center px-2 border-r border-slate-100 cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}>
                  <span className="text-xs text-foreground truncate">{item.categoria || "-"}</span>
                </div>
                <div className="col-span-4 h-full flex items-center justify-center px-2 border-r border-slate-100 cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}></div>
                <div className="col-span-4 h-full flex items-center justify-center px-2 border-r border-slate-100 cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}></div>
                <div className="col-span-2 h-full flex items-center justify-center px-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}></div>
              </>
            ) : (
              // Normal catalogo mode: Item (16) + empty remaining (28), no borders
              <>
                {/* Item cell - no border-r for parent */}
                <div
                  className="col-span-16 flex items-center gap-3 h-full pl-10 pr-4 cursor-pointer transition-colors"
                  onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
                >
                  {/* Chevron */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleExpansion(index) }}
                    className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-md hover:bg-slate-100 transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0" onClick={(e) => { e.stopPropagation(); onItemClick(item) }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-container-item-foreground font-medium truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">
                        {item.hasVariants ? `${variantCount} var.` : `${itemCount} items`}
                      </span>
                    </div>
                    {/* Marca · Categoria */}
                    <div className="flex items-center gap-1 mt-0.5">
                      {item.marca && <span className="text-xs text-muted-foreground">{item.marca}</span>}
                      {item.marca && item.categoria && <span className="text-xs text-muted-foreground">·</span>}
                      {item.categoria && <span className="text-xs text-muted-foreground">{item.categoria}</span>}
                    </div>
                  </div>
                </div>

                {/* Empty remaining columns - no borders */}
                <div className="col-span-28 h-full" />
              </>
            )
          ) : stockViewMode ? (
            // STOCK VIEW MODE: Standalone/child items - Item (8), Categoria (4), Total (4), Reservado (4), Disponible (2)
            <>
              <div
                className={`col-span-8 flex items-center gap-2 h-full border-r border-slate-100 ${isChild ? "pl-10 pr-2" : "pl-10 pr-3"} cursor-pointer transition-colors`}
                onClick={(e) => { e.stopPropagation(); onItemClick(item) }}
              >
  <div className={`${isChild ? "w-7 h-7" : "w-9 h-9"} flex-shrink-0 rounded-md bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden`}>
                    <img
                      src={getCategoryImage(item.categoria || parentItem?.categoria) || "/placeholder.svg"}
                      alt={item.categoria || parentItem?.categoria || "Product"}
                      className={`${isChild ? "w-5 h-5" : "w-6 h-6"} object-contain opacity-60`}
                    />
                  </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${isChild ? "text-muted-foreground" : "text-foreground"} font-medium truncate block`}>{item.name}</span>
                  {isChild && item.atributosPrincipales && item.atributosPrincipales.length > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {item.atributosPrincipales.slice(0, 2).map((attr, i) => (
                        <span key={i} className="text-[9px] px-1 py-0.5 rounded whitespace-nowrap bg-blue-50 text-blue-800">{attr.value}</span>
                      ))}
                    </div>
                  )}
  </div>
                </div>
                <div className="col-span-4 h-full flex items-center justify-center px-2 border-r border-slate-100 cursor-pointer" onClick={(e) => { e.stopPropagation(); onItemClick(item) }}>
                  <span className="text-xs text-foreground truncate">{item.categoria || parentItem?.categoria || "-"}</span>
                </div>
                <div
                  className="col-span-4 h-full flex items-center justify-center px-2 border-r border-slate-100 cursor-pointer hover:bg-slate-50 group/total"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsStockModalOpen(true)
                  }}
              >
                <span className="text-sm font-medium tabular-nums text-foreground group-hover/total:text-blue-600 transition-colors">{currentStockTotal}</span>
              </div>
              <div
                className="col-span-4 h-full flex items-center justify-center px-2 border-r border-slate-100 cursor-pointer hover:bg-slate-50 group/reservado"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsStockModalOpen(true)
                }}
              >
                <span className="text-sm font-medium tabular-nums text-foreground group-hover/reservado:text-blue-600 transition-colors">{item.stock?.reservado ?? 0}</span>
              </div>
              <div className="col-span-2 h-full flex items-center justify-center px-1">
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
            </>
          ) : (
            // NORMAL MODE: Standalone/child items
            <>
              <div
                className={`col-span-16 flex items-center gap-3 h-full pl-10 pr-4 cursor-pointer transition-colors ${
                  item.hasVariants || item.isAgrupador ? "" : "border-r border-slate-100"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  onItemClick(item)
                }}
              >
                {/* Product Thumbnail with category-based image - same container size, smaller image for children */}
                <div className="w-12 h-12 flex-shrink-0 rounded-md bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                  <img
                    src={getCategoryImage(item.categoria || parentItem?.categoria) || "/placeholder.svg"}
                    alt={item.categoria || parentItem?.categoria || "Product"}
                    className={`${isChild ? "w-7 h-7" : "w-8 h-8"} object-contain opacity-60`}
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
                  {/* Subtitle: standalone/parent shows marca and categoria (if exists), children show nothing */}
                  {!isChild && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {item.marca && <span className="text-xs text-muted-foreground">{item.marca}</span>}
                      {item.marca && item.categoria && <span className="text-xs text-muted-foreground">·</span>}
                      {item.categoria && <span className="text-xs text-muted-foreground">{item.categoria}</span>}
                    </div>
                  )}
                </div>
              </div>

              {showPrecioColumn && !item.hasVariants && !item.isAgrupador ? (
                <>
                  {/* Estado cell - for standalone and children */}
                  {(() => {
                    const isActive = item.isActive !== false
                    const hasNoStock = (item.stock?.disponible ?? 0) <= 0
                    const isAutoPaused = !isActive && hasNoStock // Auto-paused due to 0 stock disponible
                    const canToggle = isActive || !isAutoPaused // Can only toggle if active OR manually paused (not auto-paused)
                    const isRowInactive = !isItemActive
                    
                    return (
                      <div
                        className="col-span-8 h-full flex flex-col items-center justify-center px-2 transition-colors border-r border-slate-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (canToggle) {
                              onUpdateItem?.({ ...item, isActive: !isActive })
                            }
                          }}
                          disabled={!canToggle}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                            isActive 
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer"
                              : isAutoPaused
                                ? "bg-amber-100 text-amber-700 cursor-not-allowed"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer"
                          }`}
                        >
                          {isActive ? "Activo" : "Pausado"}
                        </button>
                        {isAutoPaused && (
                          <span 
                            className={`text-[10px] mt-1 text-center leading-tight ${
                              isRowInactive ? "text-amber-800 font-medium" : "text-slate-500"
                            }`}
                          >
                            Agregá stock para reactivar
                          </span>
                        )}
                      </div>
                    )
                  })()}
                  {/* Precio Venta cell - clickable to open precio modal */}
                  <div
                    className="col-span-10 h-full flex items-center px-4 cursor-pointer transition-colors border-r border-slate-100 hover:bg-slate-50 group/precio"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPrecioModalValues({
                        costo: item.precio?.costo || 0,
                        margen: item.precio?.margen || 0,
                        iva: item.precio?.iva || 0,
                        precioFinal: item.precio?.precioFinal || 0,
                      })
                      setIsPrecioModalOpen(true)
                    }}
                  >
                    <div className="w-full flex flex-col items-center gap-0.5">
                      <span className="text-sm text-foreground font-medium w-full text-center group-hover/precio:text-blue-600 transition-colors">
                        ${(item.precio?.precioFinal || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </>
              ) : !showPrecioColumn ? (
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
              ) : null}

              {item.hasVariants ? (
                <div className="col-span-28 h-full" />
              ) : item.isAgrupador ? (
                <div className="col-span-28 h-full" />
              ) : (
                <div
                  className="col-span-10 h-full flex items-center justify-center px-4 cursor-pointer transition-colors hover:bg-slate-50 group/stock"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsStockModalOpen(true)
                  }}
                >
                  <div className="flex items-center gap-2 tabular-nums">
                    {/* En Stock — always visible */}
                    <span className="text-sm font-medium text-foreground">
                      {currentStockTotal} <span className="text-xs font-normal text-muted-foreground">en stock</span>
                    </span>
                    {/* Reservado — only if > 0 */}
                    {currentStockReservado > 0 && (
                      <>
                        <span className="text-slate-300 select-none">·</span>
                        <span className="text-sm font-medium text-amber-600">
                          {currentStockReservado} <span className="text-xs font-normal text-amber-500">res.</span>
                        </span>
                      </>
                    )}
                    {/* Disponible — always visible */}
                    <span className="text-slate-300 select-none">·</span>
                    <span className={`text-sm font-medium tabular-nums ${
                      currentStockDisponible > 0
                        ? "text-emerald-600"
                        : currentStockDisponible < 0
                          ? "text-red-500"
                          : "text-muted-foreground"
                    }`}>
                      {currentStockDisponible} <span className="text-xs font-normal opacity-70">disp.</span>
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
          {/* Checkbox — absolute overlay on left edge */}
          <div
            className="absolute left-0 top-0 bottom-0 flex items-center pl-[18px] z-10"
            onClick={(e) => { e.stopPropagation(); onSelectClick() }}
          >
            {isIndeterminate ? (
              <button
                onClick={(e) => { e.stopPropagation(); onSelectClick() }}
                className={`h-4 w-4 flex items-center justify-center rounded-[3px] bg-slate-800 border border-slate-800 cursor-pointer ${showTransition ? "transition-opacity" : ""}`}
              >
                <Minus className="w-2.5 h-2.5 text-white" />
              </button>
            ) : isSelected ? (
              <button
                onClick={(e) => { e.stopPropagation(); onSelectClick() }}
                className={`h-4 w-4 flex items-center justify-center rounded-[3px] bg-slate-800 border border-slate-800 cursor-pointer hover:opacity-90 ${showTransition ? "transition-opacity" : ""}`}
              >
                <Check className="w-2.5 h-2.5 text-white" />
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onSelectClick() }}
                className={`h-4 w-4 cursor-pointer flex items-center justify-center rounded-[3px] border border-slate-400 bg-white ${
                  !isHovered ? "opacity-0" : "opacity-100"
                } ${showTransition ? "transition-opacity" : ""}`}
              />
            )}
          </div>

          {/* More-options — absolute overlay on right edge */}
          <div
            className={`absolute right-0 top-0 bottom-0 flex items-center pr-2 z-10 ${!isHovered ? "opacity-0" : "opacity-100"} transition-opacity duration-150`}
            onMouseEnter={handleButtonMouseEnter}
            onMouseLeave={handleButtonMouseLeave}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-slate-100 rounded transition-colors cursor-pointer focus-visible:outline-none"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-1">
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete?.(item) }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {item.hasVariants && isExpanded && item.variants && (
        <div className={gridSize === "lg" ? "mt-2" : "mt-0"}>
          {item.variants.map((variant: any, variantIndex: number) => {
            const childState = getSelectionState ? getSelectionState(variant, true) : { checked: false, indeterminate: false }
            return (
              <ItemCard
                key={variant.skuSuffix || variant.sku || variantIndex}
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
                parentItem={item}
                handleItemSelection={handleItemSelection}
                getSelectionState={getSelectionState}
                isAuditMode={isAuditMode}
                onStockChange={onStockChange}
                auditStockValues={auditStockValues}
                showPrecioColumn={showPrecioColumn}
                onUpdatePrecio={onUpdatePrecio}
                onUpdateStock={onUpdateStock}
                onUpdateItem={onUpdateItem}
                stockViewMode={stockViewMode}
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
                onUpdatePrecio={onUpdatePrecio}
                onUpdateStock={onUpdateStock}
                onUpdateItem={onUpdateItem}
                stockViewMode={stockViewMode}
              />
            )
          })}
        </div>
      )}

      {/* Precio Modal */}
      {isPrecioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsPrecioModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Item info header */}
            <div className="px-6 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={getCategoryImage(item.categoria || parentItem?.categoria) || "/placeholder.svg"}
                      alt={item.categoria || ""}
                      className="w-6 h-6 object-contain opacity-70"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">Editar Precio</h3>
                    {item.nombre && <p className="text-sm font-medium text-slate-700 mt-0.5 truncate">{item.nombre}</p>}
                    {(item.marca || item.categoria || parentItem?.marca || parentItem?.categoria) && (
                      <p className="text-xs text-slate-400 truncate">
                        {[item.marca || parentItem?.marca, item.categoria || parentItem?.categoria].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsPrecioModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6">
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Costo</label>
                <input
                  type="number"
                  value={precioModalValues.costo}
                  onChange={(e) => {
                    const costo = Number.parseFloat(e.target.value) || 0
                    const precioFinal = costo * (1 + precioModalValues.margen / 100) * (1 + precioModalValues.iva / 100)
                    setPrecioModalValues((prev) => ({ ...prev, costo, precioFinal }))
                  }}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Margen %</label>
                <input
                  type="number"
                  value={precioModalValues.margen}
                  onChange={(e) => {
                    const margen = Number.parseFloat(e.target.value) || 0
                    const precioFinal = precioModalValues.costo * (1 + margen / 100) * (1 + precioModalValues.iva / 100)
                    setPrecioModalValues((prev) => ({ ...prev, margen, precioFinal }))
                  }}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">IVA %</label>
                <input
                  type="number"
                  value={precioModalValues.iva}
                  onChange={(e) => {
                    const iva = Number.parseFloat(e.target.value) || 0
                    const precioFinal = precioModalValues.costo * (1 + precioModalValues.margen / 100) * (1 + iva / 100)
                    setPrecioModalValues((prev) => ({ ...prev, iva, precioFinal }))
                  }}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Precio Final</label>
                <input
                  type="number"
                  value={precioModalValues.precioFinal}
                  onChange={(e) => {
                    const precioFinal = Number.parseFloat(e.target.value) || 0
                    const base = precioFinal / (1 + precioModalValues.iva / 100)
                    const margen = precioModalValues.costo > 0 ? ((base / precioModalValues.costo) - 1) * 100 : 0
                    setPrecioModalValues((prev) => ({ ...prev, precioFinal, margen: Math.round(margen * 100) / 100 }))
                  }}
                  className="px-3 py-2 border border-emerald-300 bg-emerald-50 rounded-lg text-sm font-semibold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsPrecioModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={() => {
                  onUpdatePrecio?.(item.id, precioModalValues)
                  setIsPrecioModalOpen(false)
                }}
                className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Guardar
              </button>
            </div>
            </div>{/* end p-6 */}
          </div>
        </div>
      )}

{/* Stock Modal */}
      <StockEditModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onAccept={handleStockModalAccept}
        initialTotal={currentStockTotal}
        initialReservado={currentStockReservado}
        itemName={item.nombre}
        itemMarca={item.marca || parentItem?.marca}
        itemCategoria={item.categoria || parentItem?.categoria}
      />
    </div>
  )
}
