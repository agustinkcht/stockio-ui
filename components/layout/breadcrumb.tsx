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
  onNavigate?: (href: string) => void
  variant?: "light" | "dark"
}

export function Breadcrumb({ items, onNavigate, variant = "light" }: BreadcrumbProps) {
  const pathname = usePathname()

  const breadcrumbItems: BreadcrumbItem[] = items || generateBreadcrumbs(pathname)

  const mutedClass = variant === "dark" ? "text-slate-400" : "text-sidebar-muted"
  const activeClass = variant === "dark" ? "text-white font-semibold" : "text-sidebar-foreground font-medium"
  const hoverClass = variant === "dark" ? "hover:text-white" : "hover:text-sidebar-foreground"
  const chevronClass = variant === "dark" ? "text-slate-500" : "text-sidebar-muted"
  const sizeClass = variant === "dark" ? "text-sm" : "text-sm"

  return (
    <nav className={`flex items-center gap-2 ${sizeClass}`}>
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1

        return (
          <div key={index} className="flex items-center gap-2">
            {item.href && !isLast ? (
              onNavigate ? (
                <button
                  onClick={() => onNavigate(item.href!)}
                  className={`${mutedClass} ${hoverClass} cursor-pointer transition-colors bg-transparent border-none p-0 ${sizeClass}`}
                >
                  {item.label}
                </button>
              ) : (
                <Link href={item.href} className={`${mutedClass} ${hoverClass} cursor-pointer transition-colors`}>
                  {item.label}
                </Link>
              )
            ) : (
              <span className={isLast ? activeClass : mutedClass}>{item.label}</span>
            )}
            {!isLast && <ChevronRight className={`w-4 h-4 ${chevronClass}`} />}
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
