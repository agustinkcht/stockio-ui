"use client"

import { useRef } from "react"
import type { SidebarItem } from "@/lib/types"

interface SidebarProps {
  sidebarItems: SidebarItem[]
  bottomSidebarItems: SidebarItem[]
  hoveredDropdown: number | null
  onDropdownOpen: (index: number) => void
  onDropdownClose: () => void
}

export function Sidebar({
  sidebarItems,
  bottomSidebarItems,
  hoveredDropdown,
  onDropdownOpen,
  onDropdownClose,
}: SidebarProps) {
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleModuleEnter = (index: number, hasDropdown: boolean) => {
    console.log("[v0] Module enter:", index, "hasDropdown:", hasDropdown)

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current)
      openTimeoutRef.current = null
    }

    if (hasDropdown) {
      onDropdownOpen(index)
    } else {
      onDropdownClose()
    }
  }

  const handleModuleLeave = (hasDropdown: boolean) => {
    console.log("[v0] Module leave, hasDropdown:", hasDropdown)

    if (!hasDropdown) return

    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current)
      openTimeoutRef.current = null
    }

    closeTimeoutRef.current = setTimeout(() => {
      onDropdownClose()
      closeTimeoutRef.current = null
    }, 250)
  }

  const handleDropdownEnter = () => {
    console.log("[v0] Dropdown enter")

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current)
      openTimeoutRef.current = null
    }
  }

  const handleDropdownLeave = () => {
    console.log("[v0] Dropdown leave")

    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current)
      openTimeoutRef.current = null
    }

    closeTimeoutRef.current = setTimeout(() => {
      onDropdownClose()
      closeTimeoutRef.current = null
    }, 250)
  }

  return (
    <div className="w-20 border-r h-screen flex flex-col fixed left-0 top-0 z-50 border-sidebar bg-[rgba(253,254,254,1)]">
      {/* Logo */}
      <div className="flex items-center justify-center py-4 px-2">
        <span className="text-sidebar-foreground font-bold text-xl">S</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-2">
        {sidebarItems.map((item, index) => {
          const isHovered = hoveredDropdown === index
          const hasDropdown = item.hasDropdown && item.dropdownItems && item.dropdownItems.length > 0

          return (
            <div key={index} className={`relative ${isHovered ? "z-[201]" : "z-[100]"}`}>
              {/* Module Button */}
              <button
                className="flex flex-col items-center gap-1 w-full py-2 rounded-lg transition-colors cursor-pointer pt-0 relative z-[100]"
                onMouseEnter={() => handleModuleEnter(index, hasDropdown)}
                onMouseLeave={() => handleModuleLeave(hasDropdown)}
              >
                {/* Icon Container - only this gets hover bg */}
                <div
                  className={`flex items-center justify-center size-8 rounded-md transition-colors ${
                    item.active || isHovered ? "bg-gray-100" : "hover:bg-gray-100"
                  }`}
                >
                  <item.icon
                    className={`flex-shrink-0 size-5 ${
                      item.active || isHovered ? "text-sidebar-foreground" : "text-sidebar-foreground/70"
                    }`}
                  />
                </div>

                {/* Label - no hover effect */}
                <span className="text-[10px] font-medium text-center leading-tight px-1 max-w-full truncate text-sidebar-foreground/70">
                  {item.label}
                </span>
              </button>

              {/* Dropdown Panel */}
              {hasDropdown && isHovered && (
                <div
                  className="absolute left-full top-0 ml-2 z-[200] pointer-events-auto"
                  onMouseEnter={handleDropdownEnter}
                  onMouseLeave={handleDropdownLeave}
                >
                  <div className="w-56 bg-popover border border-border rounded-md shadow-lg animate-in fade-in-0 slide-in-from-left-2 duration-150">
                    {/* Dropdown Header */}
                    <div className="px-4 py-3 border-b border-border">
                      <h3 className="text-sm font-semibold text-popover-foreground uppercase tracking-wider">
                        {item.label}
                      </h3>
                    </div>

                    {/* Dropdown Items */}
                    <div className="py-2">
                      {item.dropdownItems?.map((dropdownItem, dropdownIndex) => (
                        <button
                          key={dropdownIndex}
                          onClick={() => {
                            if (dropdownItem === "Depósitos") {
                              window.location.href = "/depositos"
                            }
                            onDropdownClose()
                          }}
                          className="w-full text-left px-4 py-2 text-sm cursor-pointer text-muted-foreground hover:text-popover-foreground hover:bg-gray-100/50 transition-colors"
                        >
                          {dropdownItem}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <nav className="mt-auto mb-4 space-y-1 px-2">
        {bottomSidebarItems.map((item, index) => (
          <div key={index}>
            <button className="flex flex-col items-center gap-1 w-full py-2 rounded-lg transition-colors cursor-pointer">
              <div className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors">
                <item.icon className="w-5 h-5 flex-shrink-0 text-sidebar-foreground/70" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight px-1 max-w-full truncate text-sidebar-foreground/70">
                {item.label}
              </span>
            </button>
          </div>
        ))}
      </nav>
    </div>
  )
}
