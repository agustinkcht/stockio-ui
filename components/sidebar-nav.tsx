"use client"

import { useState, useRef } from "react"
import { Search } from "lucide-react"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"

export function SidebarNav() {
  const [hoveredDropdown, setHoveredDropdown] = useState<number | null>(null)
  const [hoveredSearch, setHoveredSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleDropdownEnter = (index: number) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current)
    setHoveredDropdown(index)
  }

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => setHoveredDropdown(null), 250)
  }

  const handleSearchEnter = () => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    setHoveredSearch(true)
  }

  const handleSearchLeave = () => {
    searchTimeoutRef.current = setTimeout(() => {
      setHoveredSearch(false)
      setSearchQuery("")
    }, 250)
  }

  const filterItems = (items: string[]) =>
    searchQuery ? items.filter((item) => item.toLowerCase().includes(searchQuery.toLowerCase())) : items

  const hasMatches = (items: string[]) => items.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="w-16 bg-gray-900 border-r border-gray-800 px-2 h-screen flex flex-col fixed left-0 top-0 z-40">
      <div className="flex items-center justify-center py-4">
        <img src="/images/logo.png" alt="Logo" className="w-10 h-10" />
      </div>
      <div className="w-full h-px bg-gray-700 mb-2" />

      {/* Search */}
      <div className="relative mb-2" onMouseEnter={handleSearchEnter} onMouseLeave={handleSearchLeave}>
        <button
          className={`w-12 h-12 flex items-center justify-center mx-auto rounded-md transition-all ${
            hoveredSearch || searchQuery ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
          } ${hoveredDropdown !== null && !hoveredSearch ? "blur-[1.5px] opacity-25" : ""}`}
        >
          <Search className="w-5 h-5" />
        </button>

        {hoveredSearch && (
          <>
            <div
              className="absolute left-full top-0 w-2 h-12 z-[100]"
              onMouseEnter={handleSearchEnter}
              onMouseLeave={handleSearchLeave}
            />
            <div
              className="absolute left-full top-0 ml-2 w-64 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-[100] p-3"
              onMouseEnter={handleSearchEnter}
              onMouseLeave={handleSearchLeave}
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
          </>
        )}
      </div>

      {/* Main Nav */}
      <nav className="space-y-0 flex-1">
        {SIDEBAR_ITEMS.map((item, index) => (
          <div
            key={index}
            className={`relative transition-all duration-300 ${
              hoveredDropdown !== null && hoveredDropdown !== index && !hoveredSearch ? "blur-[1.5px] opacity-25" : ""
            }`}
            onMouseEnter={() => handleDropdownEnter(index)}
            onMouseLeave={handleDropdownLeave}
          >
            <button className="flex items-center justify-center w-12 h-12 mx-auto rounded-md transition-colors text-gray-400 hover:text-white hover:bg-gray-800">
              <item.icon className="w-5 h-5" />
            </button>

            {hoveredDropdown === index && (
              <>
                <div
                  className="absolute left-full top-0 w-2 h-12 z-[100]"
                  onMouseEnter={() => handleDropdownEnter(index)}
                  onMouseLeave={handleDropdownLeave}
                />
                <div
                  className="absolute left-full top-0 ml-2 w-56 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-[100] animate-in fade-in-0 slide-in-from-left-2 duration-200"
                  onMouseEnter={() => handleDropdownEnter(index)}
                  onMouseLeave={handleDropdownLeave}
                >
                  <div className="px-4 py-3 border-b border-gray-700">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{item.label}</h3>
                  </div>
                  <div className="py-2">
                    {filterItems(item.dropdownItems).map((dropdownItem, idx) => (
                      <button
                        key={idx}
                        onClick={() => dropdownItem === "Depósitos" && (window.location.href = "/depositos")}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          searchQuery && dropdownItem.toLowerCase().includes(searchQuery.toLowerCase())
                            ? "text-white bg-blue-500/20 hover:bg-blue-500/30"
                            : "text-gray-300 hover:text-white hover:bg-gray-700"
                        }`}
                      >
                        {dropdownItem}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {searchQuery && !hoveredDropdown && hasMatches(item.dropdownItems) && (
              <div className="absolute left-full top-0 ml-2 w-56 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-[100]">
                <div className="px-4 py-3 border-b border-gray-700">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{item.label}</h3>
                </div>
                <div className="py-2">
                  {filterItems(item.dropdownItems).map((dropdownItem, idx) => (
                    <button
                      key={idx}
                      onClick={() => dropdownItem === "Depósitos" && (window.location.href = "/depositos")}
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

      {/* Bottom Nav */}
      <nav className="space-y-2 mt-auto mb-4">
        {BOTTOM_SIDEBAR_ITEMS.map((item, index) => (
          <button
            key={index}
            className={`flex items-center justify-center w-12 h-12 mx-auto rounded-md transition-colors text-gray-400 hover:text-white hover:bg-gray-800 ${
              hoveredDropdown !== null && !hoveredSearch ? "blur-[1.5px] opacity-25" : ""
            }`}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}
      </nav>
    </div>
  )
}
