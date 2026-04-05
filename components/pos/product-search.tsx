"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Search, Package, Plus, ChevronDown } from "lucide-react"
import Image from "next/image"
import { getCategoryImage } from "@/lib/utils/category-images"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Item, ItemVariant } from "@/lib/types"

interface ProductSearchProps {
  items: Item[]
  onAddToCart: (item: Item, variant?: ItemVariant) => void
}

export function ProductSearch({ items, onAddToCart }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const searchRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items

    const query = searchQuery.toLowerCase()
    return items.filter((item) => {
      const nameMatch = item.name?.toLowerCase().includes(query)
      const skuMatch = item.sku?.toLowerCase().includes(query)
      const marcaMatch = item.marca?.toLowerCase().includes(query)
      const categoriaMatch = item.categoria?.toLowerCase().includes(query)

      // Also search in variants
      const variantMatch = item.variants?.some(
        (v) => v.name?.toLowerCase().includes(query) || v.sku?.toLowerCase().includes(query),
      )

      return nameMatch || skuMatch || marcaMatch || categoriaMatch || variantMatch
    })
  }, [items, searchQuery])

  const getStockStatus = (stock?: { disponible: string }) => {
    const disponible = Number.parseInt(stock?.disponible || "0")
    if (disponible === 0) return { status: "sin-stock", label: "Sin stock", color: "text-red-500 bg-red-500/10" }
    if (disponible <= 3)
      return { status: "bajo", label: `Últimas ${disponible} u.`, color: "text-amber-500 bg-amber-500/10" }
    return { status: "disponible", label: `${disponible} disp.`, color: "text-emerald-500 bg-emerald-500/10" }
  }

  const getFullTitle = (item: Item | ItemVariant): string => {
    let fullTitle = item.name

    if (item.atributosPrincipales && Array.isArray(item.atributosPrincipales)) {
      const attributeValues = item.atributosPrincipales
        .map((attr) => attr.value)
        .filter((value) => value && value.trim() !== "")
        .join(" ")

      if (attributeValues) {
        fullTitle = `${fullTitle} ${attributeValues}`
      }
    }

    return fullTitle
  }

  const toggleExpanded = (sku: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(sku)) {
        next.delete(sku)
      } else {
        next.add(sku)
      }
      return next
    })
  }

  const handleAddItem = (item: Item, variant?: ItemVariant) => {
    // Check if item/variant is active
    const isActive = variant ? (variant as any).isActive !== false : item.isActive !== false
    if (!isActive) return
    
    const stock = variant?.stock || item.stock
    const disponible = Number.parseInt(stock?.disponible || "0")
    if (disponible === 0) return
    onAddToCart(item, variant)
  }

  // Check if a parent item has at least one active child
  const isParentActive = (item: Item): boolean => {
    if (item.variants && item.variants.length > 0) {
      return item.variants.some((v) => (v as any).isActive !== false)
    }
    return item.isActive !== false
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="text"
            placeholder="Buscar productos... (⌘K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      {/* Products List */}
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Package className="h-12 w-12 mb-2 opacity-30" />
            <p className="text-sm">No se encontraron productos</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const hasVariants = item.hasVariants && item.variants && item.variants.length > 0
            const isExpanded = expandedItems.has(item.sku || "")
            const stockStatus = getStockStatus(item.stock)
            const itemActive = hasVariants ? isParentActive(item) : item.isActive !== false

            return (
              <div key={item.sku} className="rounded-lg overflow-hidden">
                {/* Main Item Row */}
                <div
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                    "hover:bg-muted/50 cursor-pointer group",
                    hasVariants && isExpanded && "rounded-b-none bg-muted/30",
                    !itemActive && "opacity-50 bg-slate-100/50",
                  )}
                  onClick={() => (hasVariants ? toggleExpanded(item.sku || "") : handleAddItem(item))}
                >
                  {/* Product Image */}
                  <div className="w-12 h-12 rounded-md bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    <Image
                      src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{hasVariants ? item.name : getFullTitle(item)}</p>
                      {hasVariants && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {item.variants?.length} var.
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.marca && <span className="text-xs text-muted-foreground">{item.marca}</span>}
                      {item.categoria && <span className="text-xs text-muted-foreground">· {item.categoria}</span>}
                    </div>
                  </div>

                  {/* Price & Stock */}
                  <div className="text-right flex-shrink-0">
                    {!hasVariants && (
                      <>
                        <p className="font-semibold text-sm">
                          ${item.precio?.precioFinal?.toLocaleString("es-AR") || "0"}
                        </p>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", stockStatus.color)}>
                          {stockStatus.label}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Action Button */}
                  {hasVariants ? (
                    <ChevronDown
                      className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")}
                    />
                  ) : itemActive ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity",
                        stockStatus.status === "sin-stock" && "pointer-events-none",
                      )}
                      disabled={stockStatus.status === "sin-stock"}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddItem(item)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>

                {/* Variants */}
                {hasVariants && isExpanded && (
                  <div className="bg-muted/20 border-t border-border/30">
                    {item.variants?.map((variant) => {
                      const variantStock = getStockStatus(variant.stock)
                      const variantActive = (variant as any).isActive !== false
                      return (
                        <div
                          key={variant.sku}
                          className={cn(
                            "flex items-center gap-3 p-3 pl-8 transition-all",
                            "hover:bg-muted/50 cursor-pointer group",
                            (variantStock.status === "sin-stock" || !variantActive) && "opacity-50 bg-slate-100/30",
                          )}
                          onClick={() => handleAddItem(item, variant)}
                        >
                          {/* Product Image for Variants */}
                          <div className="w-8 h-8 rounded bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                            <Image
                              src={getCategoryImage(item.categoria) || "/placeholder.svg"}
                              alt={variant.name}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{getFullTitle(variant)}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-sm">
                              ${variant.precio?.precioFinal?.toLocaleString("es-AR") || "0"}
                            </p>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", variantStock.color)}>
                              {variantStock.label}
                            </span>
                          </div>
                          {variantActive ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              className={cn(
                                "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                                variantStock.status === "sin-stock" && "pointer-events-none",
                              )}
                              disabled={variantStock.status === "sin-stock"}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddItem(item, variant)
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
