"use client"

import { useState, useEffect } from "react"
import type { Cliente } from "@/lib/data/clientes"
import { useAccount } from "@/lib/contexts/account-context"

export function useClientes() {
  const { currentAccount } = useAccount()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadClientes = async () => {
      setIsLoading(true)

      const storageKey = `stockio-clientes-${currentAccount}`
      const savedClientes = localStorage.getItem(storageKey)

      if (savedClientes) {
        setClientes(JSON.parse(savedClientes))
      } else {
        // Load initial clientes based on current account
        try {
          if (currentAccount === "invino") {
            const { INITIAL_CLIENTES } = await import("@/lib/data/initial-clientes-invino")
            setClientes(INITIAL_CLIENTES)
            localStorage.setItem(storageKey, JSON.stringify(INITIAL_CLIENTES))
          } else if (currentAccount === "noire") {
            const { INITIAL_CLIENTES } = await import("@/lib/data/initial-clientes-noire")
            setClientes(INITIAL_CLIENTES)
            localStorage.setItem(storageKey, JSON.stringify(INITIAL_CLIENTES))
          }
        } catch (error) {
          console.error("Error loading initial clientes:", error)
          setClientes([])
        }
      }

      setIsLoading(false)
    }

    loadClientes()
  }, [currentAccount])

  const saveClientes = (newClientes: Cliente[]) => {
    const storageKey = `stockio-clientes-${currentAccount}`
    setClientes(newClientes)
    localStorage.setItem(storageKey, JSON.stringify(newClientes))
  }

  const addCliente = (clienteData: Omit<Cliente, "id" | "transactionCount">): Cliente => {
    const id = `CLI-${Date.now()}`
    const newCliente: Cliente = { id, transactionCount: 0, ...clienteData }
    const newClientes = [...clientes, newCliente]
    saveClientes(newClientes)
    return newCliente
  }

  const updateCliente = (id: string, updates: Partial<Cliente>) => {
    const newClientes = clientes.map((c) => (c.id === id ? { ...c, ...updates } : c))
    saveClientes(newClientes)
  }

  const deleteCliente = (id: string) => {
    const newClientes = clientes.filter((c) => c.id !== id)
    saveClientes(newClientes)
  }

  const getClienteById = (id: string) => {
    return clientes.find((c) => c.id === id)
  }

  const incrementTransactionCount = (clienteId: string) => {
    const newClientes = clientes.map((c) => {
      if (c.id === clienteId) {
        return { ...c, transactionCount: (c.transactionCount || 0) + 1 }
      }
      return c
    })
    saveClientes(newClientes)
    console.log(`[v0] useClientes - Incremented transaction count for cliente: ${clienteId}`)
  }

  return {
    clientes,
    isLoading,
    addCliente,
    updateCliente,
    deleteCliente,
    getClienteById,
    incrementTransactionCount,
  }
}
