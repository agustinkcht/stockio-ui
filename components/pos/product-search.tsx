"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Search, Package, Plus, ChevronRight, ChevronLeft } from "lucide-react"
import Image from "next/image"
import { getCategoryImage } from "@/lib/utils/category-images"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Item, ItemVariant } from "@/lib/types"

interface ProductSearchProps {
  items: Item[]
  onAddToCart: (item: Item, variant?: ItemVariant) => void
}

export function ProductSearch({ items, onAddToCart }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  // null = root view, string = skuPrefix (or sku) of the parent we've "entered"
  const [activeParentSku, setActiveParentSku] = useState<string | null>(null)

  // Returns the stable identifier for an item (skuPrefix for parents, sku for standalone)
  const itemId = (item: Item) => item.skuPrefix || item.sku || ""
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === "Escape" && activeParentSku) {
        setActiveParentSku(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeParentSku])

  const getTags = (item: Item | ItemVariant): string[] => {
    if (!item.atributosPrincipales || !Array.isArray(item.atributosPrincipales)) return []
    return item.atributosPrincipales
      .map((attr: any) => attr.value || attr.valor)
      .filter((v: any) => v && String(v).trim() !== "")
      .map(String)
  }

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const query = searchQuery.toLowerCase()
    return items.filter((item) => {
      // item-level fields
      if (
        item.name?.toLowerCase().includes(query) ||
        item.sku?.toLowerCase().includes(query) ||
        item.skuPrefix?.toLowerCase().includes(query) ||
        item.marca?.toLowerCase().includes(query) ||
        item.categoria?.toLowerCase().includes(query) ||
        item.descripcion?.toLowerCase().includes(query)
      ) return true
      // item attribute tags
      const itemTags = getTags(item)
      if (itemTags.some((t) => t.toLowerCase().includes(query))) return true
      // variant-level
      if (item.variants?.some((v) => {
        if (
          v.name?.toLowerCase().includes(query) ||
          v.sku?.toLowerCase().includes(query)
        ) return true
        const vTags = getTags(v)
        return vTags.some((t) => t.toLowerCase().includes(query))
      })) return true
      return false
    })
  }, [items, searchQuery])

  const getStockStatus = (stock?: { disponible?: string; enStock?: string }) => {
    const disponible = Number.parseInt(stock?.disponible || stock?.enStock || "0")
    if (disponible === 0) return { status: "sin-stock", label: "Sin stock", color: "text-red-500" }
    if (disponible <= 3)
      return { status: "bajo", label: `Últimas ${disponible} disponibles`, color: "text-amber-500" }
    return { status: "disponible", label: `${disponible} disponibles`, color: "text-emerald-600" }
  }

  const handleAddItem = (item: Item, variant?: ItemVariant) => {
    const isActive = variant ? (variant as any).isActive !== false : item.isActive !== false
    if (!isActive) return
    const stock = variant?.stock || item.stock
    const disponible = Number.parseInt(stock?.disponible || "0")
    if (disponible === 0) return
    onAddToCart(item, variant)
  }

  const parentItem = activeParentSku
    ? items.find((i) => (i.skuPrefix || i.sku) === activeParentSku) ?? null
    : null

  return (
    <div className="flex flex-col h-full">

      {/* ── Search bar — always visible ── */}
      <div className="p-4 border-b border-border/50 flex-shrink-0">
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

      {/* ── Parent view ── */}
      {parentItem ? (
        <>
          {/* Back + parent header */}
          <div className="px-4 pt-3 pb-3 border-b border-border/30 flex-shrink-0">
            <button
              onClick={() => setActiveParentSku(null)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-3"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Volver</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                <Image
                  src={getCategoryImage(parentItem.categoria) || "/placeholder.svg"}
                  alt={parentItem.name}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              </div>
              <div>
                <p className="font-semibold text-sm">{parentItem.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {parentItem.marca && <span className="text-xs text-muted-foreground">{parentItem.marca}</span>}
                  {parentItem.categoria && <span className="text-xs text-muted-foreground">· {parentItem.categoria}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {parentItem.variants?.map((variant) => {
              const variantStock = getStockStatus(variant.stock)
              const variantActive = (variant as any).isActive !== false
              const tags = getTags(variant)
              return (
                <div
                  key={variant.sku}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all group cursor-pointer hover:bg-muted/50",
                    (variantStock.status === "sin-stock" || !variantActive) && "opacity-50",
                  )}
                  onClick={() => handleAddItem(parentItem, variant)}
                >
                  <div className="w-10 h-10 rounded-md bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    <Image
                      src={getCategoryImage(parentItem.categoria) || "/placeholder.svg"}
                      alt={variant.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium truncate">{variant.name}</p>
                      {tags.map((tag) => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium leading-none flex-shrink-0">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {variant.sku && <p className="text-[11px] text-muted-foreground mt-0.5">{variant.sku}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <p className="font-semibold text-sm">${variant.precio?.precioFinal?.toLocaleString("es-AR") || "0"}</p>
                    <span className={cn("text-[11px]", variantStock.color)}>{variantStock.label}</span>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1" />
                </div>
              )
            })}
          </div>
        </>
      ) : (

        /* ── Root list ── */
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Package className="h-12 w-12 mb-2 opacity-30" />
              <p className="text-sm">No se encontraron productos</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const hasVariants = (item.hasVariants || item.tipo === "variantes" || item.tipo === "agrupador") && Array.isArray(item.variants) && item.variants.length > 0
              const stockStatus = getStockStatus(item.stock)
              const itemActive = hasVariants
                ? item.variants!.some((v) => (v as any).isActive !== false)
                : item.isActive !== false
              const tags = getTags(item)
              return (
                <div
                  key={itemId(item)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all group cursor-pointer hover:bg-muted/50",
                    !itemActive && "opacity-50",
                  )}
                  onClick={() => {
                    if (hasVariants) setActiveParentSku(itemId(item))
                    else handleAddItem(item)
                  }}
                >
                  <div className="w-11 h-11 rounded-md bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    <Image src={getCategoryImage(item.categoria) || "/placeholder.svg"} alt={item.name} fill className="object-cover" sizes="44px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      {!hasVariants && tags.map((tag) => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium leading-none flex-shrink-0">{tag}</span>
                      ))}
                      {hasVariants && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.variants?.length} var.</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.marca && <span className="text-xs text-muted-foreground">{item.marca}</span>}
                      {item.categoria && <span className="text-xs text-muted-foreground">· {item.categoria}</span>}
                    </div>
                  </div>
                  {hasVariants ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="font-semibold text-sm">${item.precio?.precioFinal?.toLocaleString("es-AR") || "0"}</p>
                        <span className={cn("text-[11px]", stockStatus.color)}>{stockStatus.label}</span>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1" />
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
