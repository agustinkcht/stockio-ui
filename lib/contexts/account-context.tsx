"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { USERS, type User } from "@/lib/data/users"

interface AccountContextType {
  currentAccount: "invino" | "noire"
  currentUser: User | null
  switchAccount: (account: "invino" | "noire") => void
  logout: () => void
}

const AccountContext = createContext<AccountContextType | undefined>(undefined)

export function AccountProvider({ children }: { children: ReactNode }) {
  const [currentAccount, setCurrentAccount] = useState<"invino" | "noire">("invino")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const router = useRouter()

  // Load account from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("stockio-current-account")
    if (stored === "invino" || stored === "noire") {
      setCurrentAccount(stored)
    } else {
      // Default to invino
      setCurrentAccount("invino")
      localStorage.setItem("stockio-current-account", "invino")
    }
  }, [])

  // Update currentUser whenever account changes
  useEffect(() => {
    const user = USERS.find((u) => u.dataSet === currentAccount)
    setCurrentUser(user || null)
    console.log("[v0] Account switched to:", currentAccount, user?.businessName)
  }, [currentAccount])

  const switchAccount = (account: "invino" | "noire") => {
    console.log("[v0] Switching account to:", account)
    setCurrentAccount(account)
    localStorage.setItem("stockio-current-account", account)
    router.push("/catalogo/items")
  }

  const logout = () => {
    console.log("[v0] Logging out, redirecting to account switcher")
    router.push("/auth/signin")
  }

  return (
    <AccountContext.Provider value={{ currentAccount, currentUser, switchAccount, logout }}>
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  const context = useContext(AccountContext)
  if (context === undefined) {
    throw new Error("useAccount must be used within an AccountProvider")
  }
  return context
}
