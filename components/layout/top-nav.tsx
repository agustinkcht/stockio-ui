"use client"
import { ChevronLeft, ChevronRight, MessageCircle, Bell, User, DotSquareIcon } from "lucide-react"

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
      </div>

      <div className="h-6 w-px bg-border mx-4" />

      <div className="flex items-center gap-1 flex-1 justify-start">
        {mockBookmarks.map((bookmark) => (
          <button
            key={bookmark.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-navbar-foreground/70 hover:text-navbar-foreground hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <DotSquareIcon className="w-3.5 h-3.5" />
            <span className="font-medium">{bookmark.label}</span>
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-border mx-4" />

      <div className="flex items-center mr-5 gap-[42px]">
        <button className="p-2 text-navbar-foreground/70 hover:text-navbar-foreground hover:bg-navbar-accent rounded-md transition-colors">
          <MessageCircle className="w-5 h-5" />
        </button>
        <button className="p-2 text-navbar-foreground/70 hover:text-navbar-foreground hover:bg-navbar-accent rounded-md transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <button className="p-2 text-navbar-foreground/70 hover:text-navbar-foreground hover:bg-navbar-accent rounded-md transition-colors mr-0">
          <User className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
