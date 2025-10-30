"use client"

import type React from "react"
import { ChevronLeft, ChevronRight, MessageCircle, Bell, X, User } from "lucide-react"

interface TopNavProps {
  currentView: { id: string; label: string; item: any | null }
  navigationHistory: Array<{ id: string; label: string; item: any | null }>
  historyIndex: number
  minimizedTabs: Array<{ id: string; label: string }>
  activeNavTab: string
  onNavigateBack: () => void
  onNavigateForward: () => void
  onRestoreTab: (tabId: string) => void
  onCloseTab: (tabId: string, e: React.MouseEvent) => void
}

export function TopNav({
  currentView,
  navigationHistory,
  historyIndex,
  minimizedTabs,
  activeNavTab,
  onNavigateBack,
  onNavigateForward,
  onRestoreTab,
  onCloseTab,
}: TopNavProps) {
  return (
    <div
      className="border-b border-gray-800 px-8 flex items-center justify-between fixed top-0 right-0 left-0 bg-gray-950 z-30 h-12"
      style={{ marginLeft: "4rem" }}
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onNavigateBack}
          disabled={historyIndex === 0}
          className={`p-1.5 rounded-md transition-colors ${historyIndex === 0 ? "text-gray-600" : "text-gray-400 cursor-pointer hover:bg-gray-800"}`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onNavigateForward}
          disabled={historyIndex === navigationHistory.length - 1}
          className={`p-1.5 rounded-md transition-colors ${historyIndex === navigationHistory.length - 1 ? "text-gray-600" : "text-gray-400 cursor-pointer hover:bg-gray-800"}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-gray-700" />

        <div className="flex items-center gap-1 flex-1">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              activeNavTab === "main" ? "bg-gray-800 text-white" : "bg-gray-700/50 text-gray-400"
            }`}
          >
            <span className="text-sm whitespace-nowrap">{currentView.label}</span>
          </div>

          {minimizedTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onRestoreTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors group ${
                activeNavTab === tab.id ? "bg-gray-800 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <span className="text-sm whitespace-nowrap">{tab.label}</span>
              {minimizedTabs.length > 0 && (
                <X
                  className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => onCloseTab(tab.id, e)}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors">
          <MessageCircle className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors">
          <User className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
