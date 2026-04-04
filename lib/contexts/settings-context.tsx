"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type CostoBehavior = "preserveMargen" | "preservePrecioFinal"

interface PreciosSettings {
  costoBehavior: CostoBehavior
}

interface SettingsContextType {
  precios: PreciosSettings
  updatePreciosSettings: (settings: Partial<PreciosSettings>) => void
}

const defaultSettings: { precios: PreciosSettings } = {
  precios: {
    costoBehavior: "preservePrecioFinal", // Default: when editing costo, preserve precio final and modify margen
  },
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [precios, setPrecios] = useState<PreciosSettings>(defaultSettings.precios)

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("stockio-settings")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.precios) {
          setPrecios({ ...defaultSettings.precios, ...parsed.precios })
        }
      } catch (e) {
        console.error("Failed to parse settings from localStorage")
      }
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("stockio-settings", JSON.stringify({ precios }))
  }, [precios])

  const updatePreciosSettings = (settings: Partial<PreciosSettings>) => {
    setPrecios((prev) => ({ ...prev, ...settings }))
  }

  return (
    <SettingsContext.Provider value={{ precios, updatePreciosSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
