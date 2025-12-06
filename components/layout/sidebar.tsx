"use client"

import { Search, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import type { SidebarItem } from "@/lib/types"

interface SidebarProps {
  sidebarItems: SidebarItem[]
  bottomSidebarItems: SidebarItem[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  hoveredSearch: boolean
  hoveredDropdown: number | null
  handleSearchMouseEnter: () => void
  handleSearchMouseLeave: () => void
  handleDropdownMouseEnter: (index: number) => void
  handleDropdownMouseLeave: () => void
  getFilteredDropdownItems: (items: string[]) => string[]
  hasMatchingItems: (items: string[]) => boolean
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
}

export function Sidebar({
  sidebarItems,
  bottomSidebarItems,
  searchQuery,
  setSearchQuery,
  hoveredSearch,
  hoveredDropdown,
  handleSearchMouseEnter,
  handleSearchMouseLeave,
  handleDropdownMouseEnter,
  handleDropdownMouseLeave,
  getFilteredDropdownItems,
  hasMatchingItems,
  isExpanded,
  setIsExpanded,
}: SidebarProps) {
  return (
    <div
      className={`${isExpanded ? "w-64" : "w-16"} blur-glass border-r px-2 h-screen transition-all duration-300 flex flex-col fixed left-0 top-0 z-50 border-sidebar bg-[rgba(253,254,254,1)]`}
    >
      <div className="flex items-center justify-between py-4 px-2 pb-2.5 pt-[9px] pl-[7px]">
        <div className="flex items-center gap-4">
          {isExpanded && <span className="text-sidebar-foreground font-semibold text-lg">Stockio</span>}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-8 h-8 flex items-center justify-center rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
          title={isExpanded ? "Colapsar sidebar" : "Expandir sidebar"}
        >
          {isExpanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded ? (
        <div className="relative px-2 mb-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black opacity-100 w-4 h-4 z-10" />
            <input
              type="text"
              placeholder="Buscar módulos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border shadow-sm rounded-md text-gray-600 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white backdrop-blur-sm transition-all border-[rgba(202,213,227,0.842391304347826)] h-8 text-xs"
            />
          </div>
        </div>
      ) : (
        <div
          className="relative px-2 mb-2.5"
          onMouseEnter={handleSearchMouseEnter}
          onMouseLeave={handleSearchMouseLeave}
        >
          <div className="flex justify-center">
            <button
              className={`w-12 h-8 flex items-center justify-center rounded-md transition-all cursor-pointer ${
                hoveredSearch || searchQuery
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              } ${hoveredDropdown !== null && !hoveredSearch ? "blur-[1.5px] opacity-25" : ""}`}
            >
              <Search className="w-5 h-5 flex-shrink-0" />
            </button>
          </div>

          {hoveredSearch && (
            <>
              <div
                className="absolute left-full top-0 w-2 h-8 z-[200]"
                onMouseEnter={handleSearchMouseEnter}
                onMouseLeave={handleSearchMouseLeave}
              />
              <div
                className="absolute left-full top-0 ml-2 w-64 bg-popover border border-border rounded-md shadow-lg z-[200] p-3"
                onMouseEnter={handleSearchMouseEnter}
                onMouseLeave={handleSearchMouseLeave}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black opacity-100 w-4 h-4 z-10" />
                  <input
                    type="text"
                    placeholder="Buscar módulos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border shadow-sm rounded-md text-gray-600 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white backdrop-blur-sm transition-all border-[rgba(202,213,227,0.842391304347826)]"
                    autoFocus
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <nav className={`flex-1 ${isExpanded ? "space-y-1" : "space-y-2"}`}>
        {sidebarItems.map((item, index) => (
          <div
            key={index}
            className={`relative transition-all duration-300 ${
              hoveredDropdown !== null && hoveredDropdown !== index && !hoveredSearch ? "blur-[1.5px] opacity-25" : ""
            }`}
            onMouseEnter={() => item.hasDropdown && !isExpanded && handleDropdownMouseEnter(index)}
            onMouseLeave={() => item.hasDropdown && !isExpanded && handleDropdownMouseLeave()}
          >
            {isExpanded ? (
              <button
                onClick={() => item.hasDropdown && handleDropdownMouseEnter(index)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md transition-colors bg-transparent cursor-pointer ${
                  item.active
                    ? "bg-gray-100 text-sidebar-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ) : (
              <button
                className={`flex items-center justify-center w-12 h-[42px] mx-auto rounded-md transition-colors cursor-pointer ${
                  item.active
                    ? "bg-gray-100 text-sidebar-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
              </button>
            )}

            {!isExpanded && item.hasDropdown && hoveredDropdown === index && (
              <>
                <div
                  className="absolute left-full top-0 w-2 h-[42px] z-[200]"
                  onMouseEnter={() => handleDropdownMouseEnter(index)}
                  onMouseLeave={handleDropdownMouseLeave}
                />
                <div
                  className="absolute left-full top-0 ml-2 w-56 bg-popover border border-border rounded-md shadow-lg z-[200] animate-in fade-in-0 slide-in-from-left-2 duration-200"
                  onMouseEnter={() => handleDropdownMouseEnter(index)}
                  onMouseLeave={handleDropdownMouseLeave}
                  style={{ minHeight: "fit-content" }}
                >
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-popover-foreground uppercase tracking-wider">
                      {item.label}
                    </h3>
                  </div>
                  <div className="py-2">
                    {(searchQuery ? getFilteredDropdownItems(item.dropdownItems) : item.dropdownItems).map(
                      (dropdownItem, dropdownIndex) => (
                        <button
                          key={dropdownIndex}
                          onClick={() => {
                            if (dropdownItem === "Depósitos") {
                              window.location.href = "/depositos"
                            }
                          }}
                          className={`w-full text-left px-4 py-2 text-sm cursor-pointer ${
                            searchQuery && dropdownItem.toLowerCase().includes(searchQuery.toLowerCase())
                              ? "text-popover-foreground bg-gray-100 hover:bg-gray-100/80"
                              : "text-muted-foreground hover:text-popover-foreground hover:bg-gray-100/50"
                          }`}
                        >
                          {dropdownItem}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </>
            )}

            {isExpanded && item.hasDropdown && hoveredDropdown === index && (
              <div className="ml-8 space-y-0.5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                {(searchQuery ? getFilteredDropdownItems(item.dropdownItems) : item.dropdownItems).map(
                  (dropdownItem, dropdownIndex) => (
                    <button
                      key={dropdownIndex}
                      onClick={() => {
                        if (dropdownItem === "Depósitos") {
                          window.location.href = "/depositos"
                        }
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                        searchQuery && dropdownItem.toLowerCase().includes(searchQuery.toLowerCase())
                          ? "text-sidebar-foreground bg-gray-100/70 hover:bg-gray-100"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-gray-100/50"
                      }`}
                    >
                      {dropdownItem}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </nav>

      <nav className={`mt-auto mb-4 ${isExpanded ? "space-y-1" : "space-y-2"}`}>
        {bottomSidebarItems.map((item, index) => (
          <div key={index}>
            {isExpanded ? (
              <button
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md transition-colors cursor-pointer text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-gray-100 ${
                  hoveredDropdown !== null && !hoveredSearch ? "blur-[1.5px] opacity-25" : ""
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ) : (
              <button
                className={`flex items-center justify-center w-12 h-[42px] mx-auto rounded-md transition-colors cursor-pointer text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-gray-100 ${
                  hoveredDropdown !== null && !hoveredSearch ? "blur-[1.5px] opacity-25" : ""
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
              </button>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}
