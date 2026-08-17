"use client"

import { useState, useRef, useEffect } from "react"
import { useAccount } from "@/lib/contexts/account-context"
import { LogOut, ChevronDown, UserCog } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export function UserPanel() {
  const { currentUser, logout } = useAccount()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!currentUser) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 border py-1 hover:bg-[#3E3F46] transition-all cursor-pointer rounded-sm bg-[#2E2F35] px-4 mt-0 border-[#3E3F46]"
      >
        <div className="w-7 h-7 rounded-md overflow-hidden bg-muted">
          <Image
            src={currentUser.avatar || "/placeholder.svg"}
            alt={currentUser.businessName}
            width={28}
            height={28}
            className="w-full h-full object-cover"
          />
        </div>
        <span className="text-sm font-medium text-white">{currentUser.businessName}</span>
        <ChevronDown className={`w-4 h-4 text-[#9A9BA3] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-border/50 py-2 z-[9999]">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={currentUser.avatar || "/placeholder.svg"}
                  alt={currentUser.businessName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{currentUser.businessName}</p>
                <p className="text-xs text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={() => { setIsOpen(false); router.push("/perfil") }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <UserCog className="w-4 h-4 text-muted-foreground" />
              Editar Perfil
            </button>
            <div className="h-px bg-border/50 mx-4 my-1" />
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
