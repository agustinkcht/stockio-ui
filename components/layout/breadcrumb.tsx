"use client"

import type React from "react"

import { ChevronRight } from "lucide-react"

interface BreadcrumbProps {
  breadcrumbText?: string
  dynamicContent?: React.ReactNode
}

export function Breadcrumb({ breadcrumbText = "Todos los items", dynamicContent }: BreadcrumbProps) {
  return (
    <div
      className="border-b border-gray-800 px-8 flex items-center justify-between fixed top-12 right-0 left-0 bg-gray-950 z-20 h-[32px]"
      style={{ marginLeft: "4rem" }}
    >
      {/* Breadcrumb Navigation - 75% width */}
      <div className="flex items-center gap-2 flex-[3]">
        <button className="text-sm text-gray-400 hover:text-white transition-colors">Items</button>
        <ChevronRight className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-white">{breadcrumbText}</span>
      </div>

      {/* Dynamic Bar - 25% width */}
      <div className="flex items-center justify-end gap-2 flex-1">{dynamicContent}</div>
    </div>
  )
}
