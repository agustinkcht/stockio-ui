"use client"
import { ChevronLeft, ChevronRight, User } from "lucide-react"

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
    <div
      className="border-b px-8 flex items-center justify-between fixed top-0 right-0 left-0 blur-glass z-40 h-12 transition-all duration-300 border-sidebar bg-[rgba(253,254,254,1)]"
      style={{ left: isExpanded ? "256px" : "64px" }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateBack}
          disabled={historyIndex === 0}
          className={`p-1.5 rounded-md transition-colors ${historyIndex === 0 ? "text-navbar-foreground/30" : "text-navbar-foreground/70 cursor-pointer hover:bg-navbar-accent"}`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onNavigateForward}
          disabled={historyIndex === navigationHistory.length - 1}
          className={`p-1.5 rounded-md transition-colors ${historyIndex === navigationHistory.length - 1 ? "text-navbar-foreground/30" : "text-navbar-foreground/70 cursor-pointer hover:bg-navbar-accent"}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 px-3 py-1.5 border border-border rounded-lg bg-background/50 hover:bg-background transition-colors cursor-pointer ml-3">
          <div className="p-1.5 bg-sidebar-accent rounded-md">
            <User className="w-4 h-4 text-navbar-foreground" />
          </div>
          <span className="text-sm font-medium text-navbar-foreground">In Vino Veritás - Admin</span>
        </div>
      </div>

      <div className="flex-1" />
    </div>
  )
}
