"use client"

import { useState, useEffect, useCallback } from "react"
import type { CajaSesion, CajaMovimiento, CajaMovimientoTipo, PaymentMethod } from "@/lib/types"
import { useAccount } from "@/lib/contexts/account-context"

export function useCaja() {
  const [sesiones, setSesiones] = useState<CajaSesion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentAccount } = useAccount()

  const getStorageKey = useCallback(() => {
    return `stockio_caja_${currentAccount || "default"}`
  }, [currentAccount])

  // Load sessions from localStorage
  useEffect(() => {
    if (!currentAccount) {
      setIsLoading(false)
      return
    }

    try {
      const storageKey = getStorageKey()
      const stored = localStorage.getItem(storageKey)

      if (stored) {
        const parsed = JSON.parse(stored)
        setSesiones(parsed)
      } else {
        // Initialize with one closed demo session
        const demoSession: CajaSesion = {
          id: 1,
          responsable: "admin@invino.com",
          estado: "cerrada",
          apertura: {
            saldoInicialEsperado: 0,
            saldoInicialContado: 0,
            diferenciaInicial: 0,
          },
          cierre: {
            saldoEsperadoEfectivo: 47200,
            saldoContadoEfectivo: 47200,
            diferenciaEfectivo: 0,
            totalPosnet: 38400,
            totalTransferencia: 12250,
          },
          timestampApertura: "2026-02-05T09:00:00",
          timestampCierre: "2026-02-05T21:00:00",
          movimientos: [
            {
              id: "MOV-001",
              tipo: "venta_efectivo",
              monto: 12000,
              descripcion: "Venta POS #VTA-001",
              timestamp: "2026-02-05T10:15:00",
              ventaId: "VTA-001",
              usuario: "admin@invino.com",
              medioPago: "efectivo",
            },
            {
              id: "MOV-002",
              tipo: "venta_posnet",
              monto: 22500,
              descripcion: "Venta POS #VTA-005",
              timestamp: "2026-02-05T11:28:00",
              ventaId: "VTA-005",
              usuario: "admin@invino.com",
              medioPago: "posnet",
            },
            {
              id: "MOV-003",
              tipo: "venta_transferencia",
              monto: 8500,
              descripcion: "Venta POS #VTA-007",
              timestamp: "2026-02-05T12:35:00",
              ventaId: "VTA-007",
              usuario: "admin@invino.com",
              medioPago: "transferencia",
            },
            {
              id: "MOV-004",
              tipo: "ingreso",
              monto: 5000,
              descripcion: "Ingreso manual",
              nota: "Cambio chico agregado",
              timestamp: "2026-02-05T13:10:00",
              usuario: "admin@invino.com",
              medioPago: "efectivo",
            },
            {
              id: "MOV-005",
              tipo: "retiro",
              monto: 30000,
              descripcion: "Retiro de efectivo",
              nota: "Guardado en caja fuerte",
              timestamp: "2026-02-05T14:45:00",
              usuario: "admin@invino.com",
              medioPago: "efectivo",
            },
            {
              id: "MOV-006",
              tipo: "venta_efectivo",
              monto: 7200,
              descripcion: "Venta POS #VTA-002",
              timestamp: "2026-02-05T15:02:00",
              ventaId: "VTA-002",
              usuario: "admin@invino.com",
              medioPago: "efectivo",
            },
            {
              id: "MOV-007",
              tipo: "venta_posnet",
              monto: 15900,
              descripcion: "Venta POS #VTA-006",
              timestamp: "2026-02-05T16:11:00",
              ventaId: "VTA-006",
              usuario: "admin@invino.com",
              medioPago: "posnet",
            },
            {
              id: "MOV-008",
              tipo: "venta_transferencia",
              monto: 3750,
              descripcion: "Venta POS #VTA-008",
              timestamp: "2026-02-05T17:26:00",
              ventaId: "VTA-008",
              usuario: "admin@invino.com",
              medioPago: "transferencia",
            },
            {
              id: "MOV-009",
              tipo: "egreso",
              monto: 2300,
              descripcion: "Egreso manual",
              nota: "Compra bolsas y cinta",
              timestamp: "2026-02-05T18:05:00",
              usuario: "admin@invino.com",
              medioPago: "efectivo",
            },
            {
              id: "MOV-010",
              tipo: "venta_efectivo",
              monto: 55300,
              descripcion: "Venta POS #VTA-003",
              timestamp: "2026-02-05T19:48:00",
              ventaId: "VTA-003",
              usuario: "admin@invino.com",
              medioPago: "efectivo",
            },
          ],
        }
        localStorage.setItem(storageKey, JSON.stringify([demoSession]))
        setSesiones([demoSession])
      }
    } catch (error) {
      console.error("[v0] Error loading caja sessions:", error)
    }
    setIsLoading(false)
  }, [currentAccount, getStorageKey])

  // Save sessions to localStorage
  const saveSesiones = useCallback(
    (newSesiones: CajaSesion[]) => {
      if (!currentAccount) return
      const storageKey = getStorageKey()
      localStorage.setItem(storageKey, JSON.stringify(newSesiones))
    },
    [currentAccount, getStorageKey],
  )

  // Get active session
  const sesionActiva = sesiones.find((s) => s.estado === "activa") || null

  // Get last closed session
  const ultimaSesionCerrada = sesiones
    .filter((s) => s.estado === "cerrada")
    .sort((a, b) => b.id - a.id)[0] || null

  // Calculate saldo esperado for the active session
  const calcularSaldoEsperado = useCallback((sesion: CajaSesion) => {
    let efectivo = sesion.apertura.saldoInicialContado
    let posnet = 0
    let transferencia = 0

    for (const mov of sesion.movimientos) {
      const monto = mov.monto
      switch (mov.tipo) {
        case "venta_efectivo":
          efectivo += monto
          break
        case "venta_posnet":
          posnet += monto
          break
        case "venta_transferencia":
          transferencia += monto
          break
        case "ingreso":
          efectivo += monto
          break
        case "egreso":
          efectivo -= monto
          break
        case "retiro":
          efectivo -= monto
          break
        case "correctivo":
          // Correctivos on closed sessions - affect efectivo
          efectivo += monto // Can be positive or negative
          break
      }
    }

    return { efectivo, posnet, transferencia }
  }, [])

  // Get pending movements (ventas made without an active session)
  const getMovimientosPendientes = useCallback(() => {
    // For now, return empty - this would be populated by ventas made outside a session
    // In the future, check ventas that don't have a matching movimiento in any session
    return [] as CajaMovimiento[]
  }, [])

  // Open a new session
  const iniciarSesion = useCallback(
    (saldoContado: number) => {
      const lastSession = sesiones.sort((a, b) => b.id - a.id)[0]
      const nextId = lastSession ? lastSession.id + 1 : 1
      const saldoEsperado = lastSession?.cierre
        ? lastSession.cierre.saldoEsperadoEfectivo + lastSession.cierre.diferenciaEfectivo
        : 0

      // Use the actual closing effective balance as expected opening
      const saldoInicialEsperado = lastSession?.cierre
        ? lastSession.cierre.saldoContadoEfectivo
        : 0

      const newSesion: CajaSesion = {
        id: nextId,
        responsable: "admin@invino.com",
        estado: "activa",
        apertura: {
          saldoInicialEsperado: saldoInicialEsperado,
          saldoInicialContado: saldoContado,
          diferenciaInicial: saldoContado - saldoInicialEsperado,
        },
        timestampApertura: new Date().toISOString(),
        movimientos: [],
      }

      const updated = [...sesiones, newSesion]
      setSesiones(updated)
      saveSesiones(updated)
      return newSesion
    },
    [sesiones, saveSesiones],
  )

  // Close the active session
  const cerrarSesion = useCallback(
    (saldoContado: number) => {
      if (!sesionActiva) return null

      const saldos = calcularSaldoEsperado(sesionActiva)

      const cierre = {
        saldoEsperadoEfectivo: saldos.efectivo,
        saldoContadoEfectivo: saldoContado,
        diferenciaEfectivo: saldoContado - saldos.efectivo,
        totalPosnet: saldos.posnet,
        totalTransferencia: saldos.transferencia,
      }

      const updated = sesiones.map((s) =>
        s.id === sesionActiva.id
          ? { ...s, estado: "cerrada" as const, cierre, timestampCierre: new Date().toISOString() }
          : s,
      )

      setSesiones(updated)
      saveSesiones(updated)
      return cierre
    },
    [sesionActiva, sesiones, saveSesiones, calcularSaldoEsperado],
  )

  // Add a movement to the active session
  const agregarMovimiento = useCallback(
    (mov: Omit<CajaMovimiento, "id" | "timestamp" | "usuario">) => {
      if (!sesionActiva) return

      const allMovIds = sesiones.flatMap((s) => s.movimientos.map((m) => {
        const match = m.id.match(/MOV-(\d+)/)
        return match ? parseInt(match[1], 10) : 0
      }))
      const maxId = Math.max(0, ...allMovIds)
      const newId = `MOV-${String(maxId + 1).padStart(3, "0")}`

      const newMov: CajaMovimiento = {
        ...mov,
        id: newId,
        timestamp: new Date().toISOString(),
        usuario: "admin@invino.com",
      }

      const updated = sesiones.map((s) =>
        s.id === sesionActiva.id
          ? { ...s, movimientos: [...s.movimientos, newMov] }
          : s,
      )

      setSesiones(updated)
      saveSesiones(updated)
    },
    [sesionActiva, sesiones, saveSesiones],
  )

  // Add a corrective movement to a closed session
  const agregarCorrectivo = useCallback(
    (sesionId: number, mov: Omit<CajaMovimiento, "id" | "timestamp" | "usuario" | "tipo">) => {
      const allMovIds = sesiones.flatMap((s) => s.movimientos.map((m) => {
        const match = m.id.match(/MOV-(\d+)/)
        return match ? parseInt(match[1], 10) : 0
      }))
      const maxId = Math.max(0, ...allMovIds)
      const newId = `MOV-${String(maxId + 1).padStart(3, "0")}`

      const newMov: CajaMovimiento = {
        ...mov,
        id: newId,
        tipo: "correctivo",
        timestamp: new Date().toISOString(),
        usuario: "admin@invino.com",
      }

      const updated = sesiones.map((s) => {
        if (s.id !== sesionId) return s
        const updatedSession = { ...s, movimientos: [...s.movimientos, newMov] }
        // Recalculate cierre if closed
        if (updatedSession.cierre) {
          let efectivo = updatedSession.apertura.saldoInicialContado
          let posnet = 0
          let transferencia = 0
          for (const m of updatedSession.movimientos) {
            switch (m.tipo) {
              case "venta_efectivo": efectivo += m.monto; break
              case "venta_posnet": posnet += m.monto; break
              case "venta_transferencia": transferencia += m.monto; break
              case "ingreso": efectivo += m.monto; break
              case "egreso": efectivo -= m.monto; break
              case "retiro": efectivo -= m.monto; break
              case "correctivo": efectivo += m.monto; break
            }
          }
          updatedSession.cierre = {
            ...updatedSession.cierre,
            saldoEsperadoEfectivo: efectivo,
            diferenciaEfectivo: updatedSession.cierre.saldoContadoEfectivo - efectivo,
            totalPosnet: posnet,
            totalTransferencia: transferencia,
          }
        }
        return updatedSession
      })

      setSesiones(updated)
      saveSesiones(updated)
    },
    [sesiones, saveSesiones],
  )

  // Register a PDV sale as a caja movement on the active session
  const registrarVentaEnCaja = useCallback(
    (ventaId: string, total: number, medioPago: PaymentMethod) => {
      if (!sesionActiva) return // No active session — movement stays untracked

      const tipoMap: Record<PaymentMethod, CajaMovimientoTipo> = {
        efectivo: "venta_efectivo",
        posnet: "venta_posnet",
        transferencia: "venta_transferencia",
      }

      agregarMovimiento({
        tipo: tipoMap[medioPago],
        monto: total,
        descripcion: `Venta POS #${ventaId}`,
        ventaId,
        medioPago,
      })
    },
    [sesionActiva, agregarMovimiento],
  )

  return {
    sesiones,
    sesionActiva,
    ultimaSesionCerrada,
    isLoading,
    calcularSaldoEsperado,
    getMovimientosPendientes,
    iniciarSesion,
    cerrarSesion,
    agregarMovimiento,
    agregarCorrectivo,
    registrarVentaEnCaja,
  }
}
