"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type CostoBehavior = "preserveMargen" | "preservePrecioFinal"

export type CondicionIva = "Consumidor Final" | "Responsable Inscripto" | "Monotributista" | "Exento"

export interface MiNegocioSettings {
  nombreApp: string
  fotoUrl: string
  tipo: "particular" | "empresa"
  nombre: string
  apellido: string
  razonSocial: string
  cuit: string
  dni: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  provincia: string
  codigoPostal: string
  condicionIva: CondicionIva
}

interface PreciosSettings {
  costoBehavior: CostoBehavior
}

interface CatalogoSettings {
  incluirVencimiento: boolean
}

interface SettingsContextType {
  miNegocio: MiNegocioSettings
  precios: PreciosSettings
  catalogo: CatalogoSettings
  updateMiNegocioSettings: (settings: Partial<MiNegocioSettings>) => void
  updatePreciosSettings: (settings: Partial<PreciosSettings>) => void
  updateCatalogoSettings: (settings: Partial<CatalogoSettings>) => void
}

const defaultMiNegocio: MiNegocioSettings = {
  nombreApp: "In Vino Veritas",
  fotoUrl: "/images/users/invino.jpg",
  tipo: "empresa",
  nombre: "",
  apellido: "",
  razonSocial: "In Vino Veritas",
  cuit: "30-71456789-2",
  dni: "",
  email: "invino@gmail.com",
  telefono: "011 4314-6816",
  direccion: "Av. Ángel T. de Alvear 1245",
  ciudad: "Don Torcuato",
  provincia: "Provincia de Buenos Aires",
  codigoPostal: "B1611ELK",
  condicionIva: "Responsable Inscripto",
}

const defaultSettings: { miNegocio: MiNegocioSettings; precios: PreciosSettings; catalogo: CatalogoSettings } = {
  miNegocio: defaultMiNegocio,
  precios: {
    costoBehavior: "preservePrecioFinal", // Default: when editing costo, preserve precio final and modify margen
  },
  catalogo: {
    incluirVencimiento: false, // Default: don't show vencimiento toggle in items
  },
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [miNegocio, setMiNegocio] = useState<MiNegocioSettings>(defaultSettings.miNegocio)
  const [precios, setPrecios] = useState<PreciosSettings>(defaultSettings.precios)
  const [catalogo, setCatalogo] = useState<CatalogoSettings>(defaultSettings.catalogo)

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const stored = localStorage.getItem("stockio-settings")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.miNegocio) {
          // Filter out empty string values so defaults are used instead
          const filteredMiNegocio = Object.fromEntries(
            Object.entries(parsed.miNegocio).filter(([, value]) => value !== "")
          )
          setMiNegocio({ ...defaultSettings.miNegocio, ...filteredMiNegocio })
        }
        if (parsed.precios) {
          setPrecios({ ...defaultSettings.precios, ...parsed.precios })
        }
        if (parsed.catalogo) {
          setCatalogo({ ...defaultSettings.catalogo, ...parsed.catalogo })
        }
      } catch (e) {
        console.error("Failed to parse settings from localStorage")
      }
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem("stockio-settings", JSON.stringify({ miNegocio, precios, catalogo }))
  }, [miNegocio, precios, catalogo])

  const updateMiNegocioSettings = (settings: Partial<MiNegocioSettings>) => {
    setMiNegocio((prev) => ({ ...prev, ...settings }))
  }

  const updatePreciosSettings = (settings: Partial<PreciosSettings>) => {
    setPrecios((prev) => ({ ...prev, ...settings }))
  }

  const updateCatalogoSettings = (settings: Partial<CatalogoSettings>) => {
    setCatalogo((prev) => ({ ...prev, ...settings }))
  }

  return (
    <SettingsContext.Provider value={{ miNegocio, precios, catalogo, updateMiNegocioSettings, updatePreciosSettings, updateCatalogoSettings }}>
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
