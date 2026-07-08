"use client"

import { ChevronRight } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  // Optional intercept — if provided, breadcrumb clicks call this instead of navigating directly
  onNavigate?: (href: string) => void
}

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  const pathname = usePathname()

  // Generate breadcrumb items based on current path if not provided
  const breadcrumbItems: BreadcrumbItem[] = items || generateBreadcrumbs(pathname)

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1

        return (
          <div key={index} className="flex items-center gap-1.5">
            {item.href && !isLast ? (
              onNavigate ? (
                <button
                  onClick={() => onNavigate(item.href!)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer transition-colors bg-transparent border-none p-0 text-sm"
                >
                  {item.label}
                </button>
              ) : (
                <Link href={item.href} className="text-slate-400 hover:text-slate-700 cursor-pointer transition-colors">
                  {item.label}
                </Link>
              )
            ) : (
              <span className={isLast ? "text-slate-800 font-semibold" : "text-slate-400"}>{item.label}</span>
            )}
            {!isLast && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </div>
        )
      })}
    </nav>
  )
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Main inventory page (items grid)
  if (pathname === "/") {
    return [{ label: "Inventario" }, { label: "Artículos", href: "/" }]
  }

  // Depositos page
  if (pathname === "/depositos") {
    return [{ label: "Inventario" }, { label: "Depósitos", href: "/depositos" }]
  }

  // Punto de Venta page
  if (pathname === "/pdv") {
    return [{ label: "Punto de Venta", href: "/pdv" }]
  }

  // Default fallback
  return [{ label: "Inventario" }]
}
