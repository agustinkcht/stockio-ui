"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react"
import { CheckCircle2, Bell, LogOut, UserCog, MoreVertical, Pencil } from "lucide-react"
import Image from "next/image"

import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { CatalogoItemDetailPanel } from "@/components/items/catalogo-item-detail-panel"
import { UnsavedChangesModal } from "@/components/modals/unsaved-changes-modal"
import { useItems } from "@/hooks/use-items"
import { useNavigation } from "@/hooks/use-navigation"
import { useNavigationGuard } from "@/hooks/use-navigation-guard"
import { useSidebar } from "@/hooks/use-sidebar"
import { useAccount } from "@/lib/contexts/account-context"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import type { Item } from "@/lib/types"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function CatalogoItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const itemParam = params.id as string

  const [isSaving, setIsSaving] = useState(false)
  const [selectedDetailTab, setSelectedDetailTab] = useState<"info" | "stock" | "precios" | "canales">("info")
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({})
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [toastLabel, setToastLabel] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((label: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToastLabel(label)
    toastTimerRef.current = setTimeout(() => setToastLabel(null), 3000)
  }, [])

  const {
    items,
    updateStock,
    updateItem,
    deleteItem,
    undoDelete,
    saveDelete: saveDeletedItems,
    hasUnsavedDeletes,
    editField,
    undoEdit,
    redoEdit,
    saveEdit,
    cancelEdit,
    hasUnsavedEdits,
    canUndoEdit,
    canRedoEdit,
    forceSaveItems,
  } = useItems()

  const { currentView, historyIndex, navigationHistory, navigateBack, navigateForward } = useNavigation()
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const { currentUser, logout } = useAccount()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const selectedItem =
    items.find((item) => item.id === itemParam) ||
    items.flatMap((item) => item.variants || []).find((variant) => variant.id === itemParam)

  const handleUndo = () => {
    if (canUndoEdit) {
      undoEdit()
    } else if (hasUnsavedDeletes) {
      undoDelete()
    }
  }

  const handleRedo = () => {
    if (canRedoEdit) {
      redoEdit()
    }
  }

  const handleDeshacer = () => {
    if (hasUnsavedEdits) {
      cancelEdit()
    }
    if (hasUnsavedDeletes) {
      undoDelete()
    }
  }

  const handleGuardar = async () => {
    setIsSaving(true)
    setShowSaveSuccess(false)
    try {
      if (hasUnsavedEdits) {
        await sleep(800)
        saveEdit()
      }
      if (hasUnsavedDeletes) {
        await sleep(800)
        await saveDeletedItems()
      }
      
      setShowSaveSuccess(true)
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (error) {
      console.error("[v0] Error saving changes:", error)
    } finally {
      setIsSaving(false)
      setShowSaveSuccess(false)
    }
  }

  const handleDeleteWithTracking = (item: Item) => {
    deleteItem(item)
    const label = item.hasVariants || item.isAgrupador ? "agrupador" : "item"
    router.push(`/catalogo/items?deleted=${encodeURIComponent(item.name)}&tipo=${label}`)
  }

  const hasUnsavedChanges = hasUnsavedEdits || hasUnsavedDeletes
  const { showNavigationModal, handleSaveAndNavigate, handleDiscardAndNavigate, handleCancelNavigation } =
    useNavigationGuard({
      hasUnsavedChanges,
      onSave: handleGuardar,
      onDiscard: handleDeshacer,
    })

  // Guarded navigation — shows modal if there are unsaved changes, otherwise navigates directly
  const guardedNavigate = (href: string) => {
    if (hasUnsavedChanges) {
      router.push(href) // router.push is intercepted by useNavigationGuard when hasUnsavedChanges is true
    } else {
      router.push(href)
    }
  }

  const handleNavigateBack = () => {
    if (hasUnsavedChanges) {
      // Use the guarded router.push which is already intercepted
      const prev = navigationHistory[historyIndex - 1]
      if (prev?.item) {
        router.push(`/catalogo/items/${prev.item.id || prev.item.sku}`)
      } else if (historyIndex > 0) {
        router.push("/catalogo/items")
      }
    } else {
      navigateBack()
    }
  }

  const handleNavigateForward = () => {
    if (hasUnsavedChanges) {
      const next = navigationHistory[historyIndex + 1]
      if (next?.item) {
        router.push(`/catalogo/items/${next.item.id || next.item.sku}`)
      } else {
        router.push("/catalogo/items")
      }
    } else {
      navigateForward()
    }
  }

  const handleClose = () => {
    router.push("/catalogo/items")
  }

  const handleFieldChange = (itemSku: string, field: string, value: any) => {
    editField(itemSku, field, value)
  }

  useEffect(() => {
    if (!selectedItem && items.length > 0) {
      router.push("/catalogo/items")
    }
  }, [selectedItem, items, router, itemParam])

  const toggleVariantExpansion = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const breadcrumbs = selectedItem
    ? [{ label: "Catálogo" }, { label: "Items", href: "/catalogo/items" }, { label: selectedItem.name }]
    : [{ label: "Catálogo" }, { label: "Items", href: "/catalogo/items" }]

  if (!selectedItem) {
    // While redirecting to a static sub-route or waiting for items, show nothing.
    return <div className="min-h-screen bg-[rgb(243,242,238)]" />
  }

  const canUndo = canUndoEdit || hasUnsavedDeletes
  const canRedo = canRedoEdit
  const hasChanges = hasUnsavedEdits || hasUnsavedDeletes

  return (
    <div className="flex h-screen overflow-hidden bg-panel-content" onClick={handleCloseDropdowns}>

      {/* Sidebar */}
      <div onClick={(e) => e.stopPropagation()} className="relative h-screen sticky top-0 z-[100003] shrink-0">
        <Sidebar
          sidebarItems={SIDEBAR_ITEMS}
          bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
          hoveredDropdown={hoveredDropdown}
          onDropdownOpen={handleDropdownMouseEnter}
          onDropdownClose={handleDropdownMouseLeave}
        />
      </div>

      {/* Right column */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 flex bg-panel-content overflow-hidden">
          <div className="flex-1 flex flex-col overflow-auto">

            {/* Sticky top bar — breadcrumb pill, bell, profile */}
            <div className="sticky top-0 z-[100004] flex items-center justify-between px-8 py-3 shrink-0">

              {/* Breadcrumb pill */}
              <div className="flex items-center bg-slate-950 rounded-full px-4 py-2">
                <Breadcrumb items={breadcrumbs} variant="dark" onNavigate={guardedNavigate} />
              </div>

              {/* Right side: bell + profile */}
              <div className="flex items-center gap-2">
                {/* Bell */}
                <button className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-950 hover:bg-slate-800 transition-colors cursor-pointer">
                  <Bell className="w-5 h-5 text-slate-300" />
                </button>

                {/* Profile pill */}
                {currentUser && (
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setProfileOpen(v => !v) }}
                      className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 rounded-full pl-4 pr-1 py-1 transition-colors cursor-pointer"
                    >
                      <span className="text-sm font-medium text-slate-200 max-w-[120px] truncate">
                        {currentUser.businessName}
                      </span>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 shrink-0 flex items-center justify-center">
                        {currentUser.avatar ? (
                          <Image src={currentUser.avatar} alt={currentUser.businessName} width={32} height={32} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-semibold text-white">
                            {currentUser.businessName?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </button>

                    {profileOpen && (
                      <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-border rounded-lg shadow-lg py-2 z-[100010]">
                        <div className="px-4 py-3 border-b border-border">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-muted shrink-0">
                              {currentUser.avatar ? (
                                <Image src={currentUser.avatar} alt={currentUser.businessName} width={36} height={36} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                                  {currentUser.businessName?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{currentUser.businessName}</p>
                              <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="py-1">
                          <button
                            onClick={() => { setProfileOpen(false); router.push("/perfil") }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            <UserCog className="w-4 h-4 text-muted-foreground" />
                            Editar Perfil
                          </button>
                          <div className="h-px bg-border/50 mx-4 my-1" />
                          <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            Cerrar Sesión
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Title row */}
            <div className="px-8 pt-6 pb-6">
              <div className="flex items-start justify-between gap-6">
                <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight text-balance">
                  {selectedItem.name}
                </h1>
                <div className="flex items-center gap-2 mt-1 shrink-0">
                  <button
                    type="button"
                    className="h-9 px-4 text-sm font-semibold transition-colors gap-2 rounded-lg flex items-center bg-slate-950 text-white hover:bg-slate-800 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-950 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Detail panel content */}
            <div className="flex-1 px-8 pb-8">
              <CatalogoItemDetailPanel
                selectedItem={selectedItem}
                selectedDetailTab={selectedDetailTab}
                setSelectedDetailTab={setSelectedDetailTab}
                expandedItems={expandedItems}
                toggleVariantExpansion={toggleVariantExpansion}
                updateStock={updateStock}
                updateItem={updateItem}
                allItems={items}
                item={selectedItem}
                onClose={handleClose}
                onFieldChange={handleFieldChange}
                isSaving={isSaving}
                onDuplicate={(item) => console.log("Duplicate", item)}
                onDelete={handleDeleteWithTracking}
                variantChangeHandlers={{}}
                isExpanded={false}
                onSaveNow={forceSaveItems}
                onShowToast={showToast}
              />
            </div>

          </div>
        </main>
      </div>

      {/* Floating toast */}
      {toastLabel && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200000] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className="relative flex items-stretch rounded-2xl overflow-hidden"
            style={{ background: "#0d0f12", boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.07)", minWidth: "280px" }}
          >
            <div className="w-[3px] shrink-0" style={{ background: "linear-gradient(to bottom, #34d399, #059669)" }} />
            <div className="flex items-center gap-3.5 px-5 py-4">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.2)" }}
              >
                <CheckCircle2 className="w-4 h-4" style={{ color: "#34d399" }} strokeWidth={2.25} />
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-tight" style={{ color: "#f1f5f9", letterSpacing: "-0.01em" }}>Cambios guardados</p>
                <p className="text-[11px] mt-0.5 leading-tight" style={{ color: "rgba(148,163,184,0.7)" }}>{toastLabel}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <UnsavedChangesModal
        isOpen={showNavigationModal}
        onSave={handleSaveAndNavigate}
        onDiscard={handleDiscardAndNavigate}
        onCancel={handleCancelNavigation}
      />
    </div>
  )
}
