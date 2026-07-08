"use client"
import { User } from "lucide-react"

const mockBookmarks = [
  { id: "champagne-domiciano", label: "Champagne Domiciano" },
  { id: "precios-2025", label: "Precios 2025" },
  { id: "coleccion-navidad", label: "Colección Navidad" },
]

interface TopNavProps {
  currentView: { id: string; label: string; item: any | null }
  navigationHistory: Array<{ id: string; label: string; item: any | null }>
  historyIndex: number
  onNavigateBack: () => void
  onNavigateForward: () => void
  breadcrumbs?: string[]
  isExpanded?: boolean
}

export function TopNav({
  currentView,
  navigationHistory,
  historyIndex,
  onNavigateBack,
  onNavigateForward,
  breadcrumbs = ["Artículos", "Todos los items"],
  isExpanded = true,
}: TopNavProps) {
  return (
    <div className="flex items-center justify-between fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-1 h-10">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3 border border-sidebar-border bg-navbar hover:bg-sidebar-accent transition-colors cursor-pointer ml-0 mt-1.5 rounded-sm py-1.5">
          <div className="p-1.5 bg-sidebar-accent rounded-md px-1 py-1 mt-0">
            <User className="w-4 h-4 text-sidebar-muted" />
          </div>
          <span className="text-sm font-medium text-sidebar-foreground">In Vino Veritás - Admin</span>
        </div>
      </div>

      <div className="flex-1" />
    </div>
  )
}
