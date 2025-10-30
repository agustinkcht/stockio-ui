"use client"

import { useState } from "react"
import type { Item, DetailTab, Atributo, ContainerAtributo, VariantItem } from "@/lib/types"

export function useItemDetail() {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})

  const [showDetail, setShowDetail] = useState(false)
  const [selectedDetailTab, setSelectedDetailTab] = useState<DetailTab>("info")
  const [isViewingContainer, setIsViewingContainer] = useState(false)
  const [gridSize, setGridSize] = useState<"sm" | "md" | "lg">("md")
  const [gridSizeDropdownOpen, setGridSizeDropdownOpen] = useState(false)

  // Form fields
  const [itemTitulo, setItemTitulo] = useState("")
  const [itemTemplate, setItemTemplate] = useState("")
  const [itemUbicacion, setItemUbicacion] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [marca, setMarca] = useState("")
  const [modelo, setModelo] = useState("")
  const [formatoVenta, setFormatoVenta] = useState("unidad")
  const [unidadesPorPack, setUnidadesPorPack] = useState("")
  const [unidadesPorPackActive, setUnidadesPorPackActive] = useState(false)
  const [volumenActive, setVolumenActive] = useState(false)
  const [volumenCantidad, setVolumenCantidad] = useState("")
  const [volumenUnidad, setVolumenUnidad] = useState("")

  // Pricing fields
  const [costo, setCosto] = useState("1200")
  const [margenActive, setMargenActive] = useState(false)
  const [margen, setMargen] = useState("25")
  const [precio, setPrecio] = useState("6200")
  const [iva, setIva] = useState("21")
  const [impuestoInterno, setImpuestoInterno] = useState("0")
  const [proveedor, setProveedor] = useState("")
  const [codigoProveedor, setCodigoProveedor] = useState("")

  // Attributes
  const [atributosPrincipales, setAtributosPrincipales] = useState<Atributo[]>([])
  const [atributosInformativos, setAtributosInformativos] = useState<Atributo[]>([])
  const [containerAtributosPrincipales, setContainerAtributosPrincipales] = useState<ContainerAtributo[]>([])
  const [varianteInput, setVarianteInput] = useState<{ [key: number]: string }>({})
  const [showAtributosView, setShowAtributosView] = useState(false)
  const [showIndividualAtributosView, setShowIndividualAtributosView] = useState(false)

  // Variant items
  const [variantItems, setVariantItems] = useState<VariantItem[]>([])
  const [expandedVariantStock, setExpandedVariantStock] = useState<{ [sku: string]: boolean }>({})

  // Copy states
  const [skuCopied, setSkuCopied] = useState(false)
  const [codigoUniversalCopied, setCodigoUniversalCopied] = useState(false)

  // Dropdown states
  const [showNuevoDropdown, setShowNuevoDropdown] = useState(false)
  const [showAccionesDropdown, setShowAccionesDropdown] = useState(false)
  const [showMargenTooltip, setShowMargenTooltip] = useState(false)

  const toggleVariantStockExpansion = (sku: string) => {
    setExpandedVariantStock((prev) => ({
      ...prev,
      [sku]: !prev[sku],
    }))
  }

  const updateVariantField = (sku: string, field: "codigoUniversal" | "descripcion" | "foto", value: string) => {
    setVariantItems((prev) => prev.map((item) => (item.sku === sku ? { ...item, [field]: value } : item)))
  }

  const handleCopySku = async (sku?: string, isContainer?: boolean, itemName?: string) => {
    if (sku) {
      await navigator.clipboard.writeText(sku)
      setSkuCopied(true)
      setTimeout(() => setSkuCopied(false), 2000)
    } else if (isContainer && itemName) {
      const skuPadre = itemName
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .split(" ")
        .map((word) => word.substring(0, 3))
        .join("-")
        .substring(0, 15)
      await navigator.clipboard.writeText(skuPadre)
      setSkuCopied(true)
      setTimeout(() => setSkuCopied(false), 2000)
    }
  }

  const handleCopyCodigoUniversal = async (codigoUniversal?: string) => {
    if (codigoUniversal) {
      await navigator.clipboard.writeText(codigoUniversal)
      setCodigoUniversalCopied(true)
      setTimeout(() => setCodigoUniversalCopied(false), 2000)
    }
  }

  const resetFormFields = () => {
    setItemTitulo("")
    setItemTemplate("")
    setItemUbicacion("")
    setDescripcion("")
    setMarca("")
    setModelo("")
    setFormatoVenta("unidad")
    setUnidadesPorPack("")
    setUnidadesPorPackActive(false)
    setVolumenActive(false)
    setVolumenCantidad("")
    setVolumenUnidad("")
    setCosto("1200")
    setPrecio("6200")
    setIva("21")
    setImpuestoInterno("0")
    setProveedor("")
    setCodigoProveedor("")
    setAtributosPrincipales([])
    setAtributosInformativos([])
    setContainerAtributosPrincipales([])
    setShowAtributosView(false)
    setShowIndividualAtributosView(false)
  }

  const handleItemClick = (item: Item, tab: string, isContainer?: boolean) => {
    setSelectedItem(item)
    setSelectedDetailTab(tab as DetailTab)
    setIsViewingContainer(isContainer || false)
    setShowDetail(true)
  }

  const toggleVariantExpansion = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  return {
    selectedItem,
    setSelectedItem,
    expandedItems,
    setExpandedItems,
    handleItemClick,
    toggleVariantExpansion,

    showDetail,
    setShowDetail,
    selectedDetailTab,
    setSelectedDetailTab,
    isViewingContainer,
    setIsViewingContainer,
    gridSize,
    setGridSize,
    gridSizeDropdownOpen,
    setGridSizeDropdownOpen,
    itemTitulo,
    setItemTitulo,
    itemTemplate,
    setItemTemplate,
    itemUbicacion,
    setItemUbicacion,
    descripcion,
    setDescripcion,
    marca,
    setMarca,
    modelo,
    setModelo,
    formatoVenta,
    setFormatoVenta,
    unidadesPorPack,
    setUnidadesPorPack,
    unidadesPorPackActive,
    setUnidadesPorPackActive,
    volumenActive,
    setVolumenActive,
    volumenCantidad,
    setVolumenCantidad,
    volumenUnidad,
    setVolumenUnidad,
    costo,
    setCosto,
    margenActive,
    setMargenActive,
    margen,
    setMargen,
    precio,
    setPrecio,
    iva,
    setIva,
    impuestoInterno,
    setImpuestoInterno,
    proveedor,
    setProveedor,
    codigoProveedor,
    setCodigoProveedor,
    atributosPrincipales,
    setAtributosPrincipales,
    atributosInformativos,
    setAtributosInformativos,
    containerAtributosPrincipales,
    setContainerAtributosPrincipales,
    varianteInput,
    setVarianteInput,
    showAtributosView,
    setShowAtributosView,
    showIndividualAtributosView,
    setShowIndividualAtributosView,
    variantItems,
    setVariantItems,
    expandedVariantStock,
    setExpandedVariantStock,
    skuCopied,
    setSkuCopied,
    codigoUniversalCopied,
    setCodigoUniversalCopied,
    showNuevoDropdown,
    setShowNuevoDropdown,
    showAccionesDropdown,
    setShowAccionesDropdown,
    showMargenTooltip,
    setShowMargenTooltip,
    toggleVariantStockExpansion,
    updateVariantField,
    handleCopySku,
    handleCopyCodigoUniversal,
    resetFormFields,
  }
}
