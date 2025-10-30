"use client"

import { Search } from "lucide-react"
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
}: SidebarProps) {
  return (
    <div className="w-16 bg-gray-900 border-r border-gray-800 px-2 h-screen transition-all duration-300 flex flex-col fixed left-0 top-0 z-40">
      <div className="flex items-center justify-center py-4">
        <img src="/images/stockio-icon.png" alt="Stockio" className="w-10 mt-0.5" />
      </div>

      <div className="w-full h-px bg-gray-700 mb-1 mt-1" />

      {/* Search icon */}
      <div className="relative mb-2" onMouseEnter={handleSearchMouseEnter} onMouseLeave={handleSearchMouseLeave}>
        <button
          className={`w-12 h-12 flex items-center justify-center mx-auto rounded-md transition-all ${
            hoveredSearch || searchQuery ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
          } ${hoveredDropdown !== null && !hoveredSearch ? "blur-[1.5px] opacity-25" : ""}`}
        >
          <Search className="w-5 h-5 flex-shrink-0" />
        </button>

        {hoveredSearch && (
          <div
            className="absolute left-full top-0 w-2 h-12 z-[100]"
            onMouseEnter={handleSearchMouseEnter}
            onMouseLeave={handleSearchMouseLeave}
          />
        )}

        {hoveredSearch && (
          <div
            className="absolute left-full top-0 ml-2 w-64 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-[100] p-3"
            onMouseEnter={handleSearchMouseEnter}
            onMouseLeave={handleSearchMouseLeave}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar módulos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Main navigation icons */}
      <nav className="space-y-0 flex-1">
        {sidebarItems.map((item, index) => (
          <div
            key={index}
            className={`relative transition-all duration-300 ${
              hoveredDropdown !== null && hoveredDropdown !== index && !hoveredSearch ? "blur-[1.5px] opacity-25" : ""
            }`}
            onMouseEnter={() => item.hasDropdown && handleDropdownMouseEnter(index)}
            onMouseLeave={() => item.hasDropdown && handleDropdownMouseLeave()}
          >
            <button
              className={`flex items-center justify-center w-12 h-12 mx-auto rounded-md transition-colors ${
                item.active ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
            </button>

            {item.hasDropdown && hoveredDropdown === index && (
              <div
                className="absolute left-full top-0 w-2 h-12 z-[100]"
                onMouseEnter={() => handleDropdownMouseEnter(index)}
                onMouseLeave={handleDropdownMouseLeave}
              />
            )}

            {item.hasDropdown && hoveredDropdown === index && (
              <div
                className="absolute left-full top-0 ml-2 w-56 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-[100] animate-in fade-in-0 slide-in-from-left-2 duration-200"
                onMouseEnter={() => handleDropdownMouseEnter(index)}
                onMouseLeave={handleDropdownMouseLeave}
                style={{ minHeight: "fit-content" }}
              >
                <div className="px-4 py-3 border-b border-gray-700">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{item.label}</h3>
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
                        className={`w-full text-left px-4 py-2 text-sm ${
                          searchQuery && dropdownItem.toLowerCase().includes(searchQuery.toLowerCase())
                            ? "text-white bg-blue-500/20 hover:bg-blue-500/30"
                            : "text-gray-300 hover:text-white hover:bg-gray-700"
                        }`}
                      >
                        {dropdownItem}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            {searchQuery && !hoveredDropdown && item.dropdownItems && hasMatchingItems(item.dropdownItems) && (
              <div
                className="absolute left-full top-0 ml-2 w-56 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-[100]"
                style={{ minHeight: "fit-content" }}
              >
                <div className="px-4 py-3 border-b border-gray-700">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{item.label}</h3>
                </div>

                <div className="py-2">
                  {getFilteredDropdownItems(item.dropdownItems).map((dropdownItem, dropdownIndex) => (
                    <button
                      key={dropdownIndex}
                      onClick={() => {
                        if (dropdownItem === "Depósitos") {
                          window.location.href = "/depositos"
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-white bg-blue-500/20 hover:bg-blue-500/30"
                    >
                      {dropdownItem}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom navigation icons */}
      <nav className="space-y-2 mt-auto mb-4">
        {bottomSidebarItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <button
              className={`flex items-center justify-center w-12 h-12 mx-auto rounded-md transition-colors text-gray-400 hover:text-white hover:bg-gray-800 ${
                hoveredDropdown !== null && !hoveredSearch ? "blur-[1.5px] opacity-25" : ""
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
            </button>
          </div>
        ))}
      </nav>
    </div>
  )
}
