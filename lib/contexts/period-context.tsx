"use client"

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react"
import { getMesEnCursoPeriod, type PeriodRange } from "@/lib/utils/dashboard-period"
import { useSettings } from "@/lib/contexts/settings-context"

export type PeriodKey =
  | "hoy"
  | "mes_en_curso"
  | "mes_anterior"
  | "7d"
  | "30d"
  | "ano_en_curso"
  | "historico"
  | "personalizado"

export interface PeriodOption {
  key: PeriodKey
  label: string
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { key: "hoy", label: "Hoy" },
  { key: "mes_en_curso", label: "Mes en Curso" },
  { key: "mes_anterior", label: "Mes Anterior" },
  { key: "7d", label: "Últimos 7 días" },
  { key: "30d", label: "Últimos 30 días" },
  { key: "ano_en_curso", label: "Año en Curso" },
  { key: "historico", label: "Histórico" },
  { key: "personalizado", label: "Personalizado" },
]

export interface CustomRange {
  start: Date
  end: Date
}

interface PeriodContextValue {
  periodKey: PeriodKey
  customRange: CustomRange | null
  setPeriodKey: (k: PeriodKey) => void
  setCustomRange: (r: CustomRange | null) => void
}

const PeriodContext = createContext<PeriodContextValue | undefined>(undefined)

const STORAGE_KEY = "stockio-period"

interface StoredPeriod {
  periodKey: PeriodKey
  customRange: { start: string; end: string } | null
}

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [periodKey, setPeriodKey] = useState<PeriodKey>("mes_en_curso")
  const [customRange, setCustomRange] = useState<CustomRange | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored) as StoredPeriod
      if (parsed.periodKey) setPeriodKey(parsed.periodKey)
      if (parsed.customRange) {
        setCustomRange({
          start: new Date(parsed.customRange.start),
          end: new Date(parsed.customRange.end),
        })
      }
    } catch {
      /* noop */
    }
  }, [])

  useEffect(() => {
    const toStore: StoredPeriod = {
      periodKey,
      customRange: customRange
        ? { start: customRange.start.toISOString(), end: customRange.end.toISOString() }
        : null,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  }, [periodKey, customRange])

  return (
    <PeriodContext.Provider value={{ periodKey, customRange, setPeriodKey, setCustomRange }}>
      {children}
    </PeriodContext.Provider>
  )
}

export function usePeriod() {
  const ctx = useContext(PeriodContext)
  if (!ctx) throw new Error("usePeriod must be used within a PeriodProvider")
  return ctx
}

const ymd = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

/**
 * Compute the active PeriodRange from current selection.
 * Pass `firstSaleDate` (YYYY-MM-DD) if you want "histórico" to span from there.
 */
export function resolvePeriodRange(
  periodKey: PeriodKey,
  mesEnCursoStartDay: number,
  customRange: CustomRange | null,
  firstSaleDate?: string | null,
): PeriodRange {
  const today = new Date()

  if (periodKey === "personalizado" && customRange) {
    const start = new Date(customRange.start)
    start.setHours(0, 0, 0, 0)
    const end = new Date(customRange.end)
    end.setHours(23, 59, 59, 999)
    return { start, end, startStr: ymd(start), endStr: ymd(end), label: "Personalizado" }
  }

  if (periodKey === "hoy") {
    const start = new Date(today)
    start.setHours(0, 0, 0, 0)
    const end = new Date(today)
    return { start, end, startStr: ymd(start), endStr: ymd(end), label: "Hoy" }
  }

  if (periodKey === "mes_en_curso") {
    return getMesEnCursoPeriod(mesEnCursoStartDay)
  }

  if (periodKey === "mes_anterior") {
    const current = getMesEnCursoPeriod(mesEnCursoStartDay)
    const ref = new Date(current.start)
    ref.setDate(ref.getDate() - 1)
    return getMesEnCursoPeriod(mesEnCursoStartDay, ref)
  }

  if (periodKey === "7d" || periodKey === "30d") {
    const days = periodKey === "7d" ? 7 : 30
    const end = new Date(today)
    end.setHours(23, 59, 59, 999)
    const start = new Date(today)
    start.setDate(start.getDate() - (days - 1))
    start.setHours(0, 0, 0, 0)
    return { start, end, startStr: ymd(start), endStr: ymd(end), label: `Últimos ${days} días` }
  }

  if (periodKey === "historico") {
    const end = new Date(today)
    end.setHours(23, 59, 59, 999)
    const start = firstSaleDate
      ? new Date(`${firstSaleDate}T00:00:00`)
      : new Date(today.getFullYear(), 0, 1)
    start.setHours(0, 0, 0, 0)
    const label = firstSaleDate
      ? `Histórico desde ${start.getDate()} ${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`
      : "Histórico"
    return { start, end, startStr: ymd(start), endStr: ymd(end), label }
  }

  // ano_en_curso
  const start = new Date(today.getFullYear(), 0, 1)
  const end = new Date(today)
  end.setHours(23, 59, 59, 999)
  return { start, end, startStr: ymd(start), endStr: ymd(end), label: `Año ${today.getFullYear()}` }
}

/**
 * Convenience hook: returns the active range. Pass `firstSaleDate` (YYYY-MM-DD)
 * so "histórico" can span from your first sale on this page.
 */
export function usePeriodRange(firstSaleDate?: string | null): PeriodRange {
  const { periodKey, customRange } = usePeriod()
  const { dashboard } = useSettings()
  return useMemo(
    () => resolvePeriodRange(periodKey, dashboard.mesEnCursoStartDay, customRange, firstSaleDate),
    [periodKey, customRange, dashboard.mesEnCursoStartDay, firstSaleDate],
  )
}
