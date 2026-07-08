"use client"

import React, { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { SidebarItem } from "@/lib/types"

interface SidebarProps {
  sidebarItems: SidebarItem[]
  bottomSidebarItems: SidebarItem[]
  hoveredDropdown: number | null
  onDropdownOpen: (index: number) => void
  onDropdownClose: () => void
  onNavigate?: (href: string) => void
}

export function Sidebar({
  sidebarItems,
  bottomSidebarItems,
  hoveredDropdown,
  onDropdownOpen,
  onDropdownClose,
  onNavigate,
}: SidebarProps) {
  const router = useRouter()
  const navigate = (href: string) => onNavigate ? onNavigate(href) : router.push(href)
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside the sidebar
  useEffect(() => {
    if (hoveredDropdown === null) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onDropdownClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [hoveredDropdown, onDropdownClose])

  const getActiveModule = (item: SidebarItem): boolean => {
    if (item.dropdown && item.dropdown.length > 0) {
      return item.dropdown.some((dropdownItem) =>
        pathname.startsWith(dropdownItem.href.split("/").slice(0, 2).join("/")),
      )
    }
    if (item.href) {
      return pathname === item.href || pathname.startsWith(item.href + "/")
    }
    return false
  }

  const handleModuleClick = (index: number, hasDropdown: boolean, href?: string) => {
    if (hasDropdown) {
      // Toggle: if already open close it, otherwise open it
      if (hoveredDropdown === index) {
        onDropdownClose()
      } else {
        onDropdownOpen(index)
      }
    } else {
      onDropdownClose()
      if (href) navigate(href)
    }
  }

  const handleDropdownItemClick = (href: string) => {
    navigate(href)
    onDropdownClose()
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col z-[99999] bg-sidebar w-20">
      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-2 pt-4">
      {sidebarItems.map((item, index) => {
        const isOpen = hoveredDropdown === index
        const isActive = getActiveModule(item)
        const hasDropdown =
          item.hasDropdown &&
          ((item.dropdown && item.dropdown.length > 0) || (item.dropdownItems && item.dropdownItems.length > 0))

        const dividerClass = "mx-3 mt-1.5 mb-1.5 border-t border-sidebar-foreground/10"

        return (
          <React.Fragment key={index}>
            <div className={`relative ${isOpen ? "z-[100001]" : "z-[100000]"}`}>
              {/* Module Button */}
              <button
                className="flex flex-col items-center gap-1 w-full py-2 rounded-lg transition-colors cursor-pointer pt-0 relative z-[100]"
                onClick={() => handleModuleClick(index, hasDropdown, item.href)}
              >
                {/* Icon Container */}
                <div
                  className={`flex items-center justify-center size-8 rounded-md transition-colors ${
                    isActive || isOpen ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"
                  }`}
                >
                  <item.icon
                    className={`flex-shrink-0 size-5 ${
                      isActive || isOpen ? "text-sidebar-foreground" : "text-sidebar-muted"
                    }`}
                  />
                </div>

                {/* Label */}
                <span className={`text-[10px] font-medium text-center leading-tight px-1 max-w-full truncate ${
                  isActive || isOpen ? "text-sidebar-foreground" : "text-sidebar-muted"
                }`}>
                  {item.label}
                </span>
              </button>

              {/* Dropdown Panel */}
              {hasDropdown && isOpen && (
                <div className="absolute left-full top-0 ml-2 z-[100002] pointer-events-auto">
                  <div className="w-56 bg-popover border border-border rounded-md shadow-lg animate-in fade-in-0 slide-in-from-left-2 duration-150">
                    {/* Dropdown Header */}
                    <div className="px-4 py-3 border-b border-border">
                      <h3 className="text-sm font-semibold text-popover-foreground uppercase tracking-wider">
                        {item.label}
                      </h3>
                    </div>

                    {/* Dropdown Items */}
                    <div className="py-2">
                      {item.dropdown?.map((dropdownItem, dropdownIndex) => (
                        <button
                          key={dropdownIndex}
                          onClick={() => handleDropdownItemClick(dropdownItem.href)}
                          className="w-full text-left px-4 py-2 text-sm cursor-pointer text-muted-foreground hover:text-popover-foreground hover:bg-gray-100/50 transition-colors"
                        >
                          {dropdownItem.label}
                        </button>
                      ))}
                      {!item.dropdown &&
                        item.dropdownItems?.map((dropdownItem, dropdownIndex) => (
                          <button
                            key={dropdownIndex}
                            onClick={() => {
                              if (dropdownItem === "Depósitos") {
                                navigate("/depositos")
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

            {/* Divider */}
            {item.dividerAfter && (
              <div className={dividerClass} />
            )}
          </React.Fragment>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <nav className="mt-auto mb-4 space-y-1 px-2">
        {bottomSidebarItems.map((item, index) => {
          const isAjustes = item.label === "Ajustes"
          const isActive = isAjustes && pathname.startsWith("/ajustes")
          
          return (
            <div key={index}>
              <button 
                className="flex flex-col items-center gap-1 w-full py-2 rounded-lg transition-colors cursor-pointer"
                onClick={() => {
                  if (isAjustes) {
                    navigate("/ajustes")
                  }
                }}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                  isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"
                }`}>
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? "text-sidebar-foreground" : "text-sidebar-muted"
                  }`} />
                </div>
                <span className={`text-[10px] font-medium text-center leading-tight px-1 max-w-full truncate ${
                  isActive ? "text-sidebar-foreground" : "text-sidebar-muted"
                }`}>
                  {item.label}
                </span>
              </button>
            </div>
          )
        })}
      </nav>
    </div>
  )
}
