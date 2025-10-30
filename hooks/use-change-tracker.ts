"use client"

import { useState, useCallback } from "react"

export type ChangeType = "delete" | "edit" | "add"

export interface Change {
  id: string
  type: ChangeType
  timestamp: number
  data: any
  previousData?: any
}

export function useChangeTracker() {
  const [changes, setChanges] = useState<Change[]>([])
  const [history, setHistory] = useState<Change[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const hasUnsavedChanges = changes.length > 0

  const trackChange = useCallback(
    (type: ChangeType, data: any, previousData?: any) => {
      const change: Change = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        timestamp: Date.now(),
        data,
        previousData,
      }

      setChanges((prev) => [...prev, change])

      // Add to history for undo/redo
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1)
        return [...newHistory, change]
      })
      setHistoryIndex((prev) => prev + 1)
    },
    [historyIndex],
  )

  const undo = useCallback(() => {
    if (historyIndex < 0) return null

    const changeToUndo = history[historyIndex]
    setHistoryIndex((prev) => prev - 1)

    // Remove the change from changes list
    setChanges((prev) => prev.filter((c) => c.id !== changeToUndo.id))

    return changeToUndo
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return null

    const changeToRedo = history[historyIndex + 1]
    setHistoryIndex((prev) => prev + 1)

    // Add the change back to changes list
    setChanges((prev) => [...prev, changeToRedo])

    return changeToRedo
  }, [history, historyIndex])

  const undoAll = useCallback(() => {
    setChanges([])
    setHistory([])
    setHistoryIndex(-1)
  }, [])

  const saveAll = useCallback(() => {
    const changesToSave = [...changes]
    setChanges([])
    setHistory([])
    setHistoryIndex(-1)
    return changesToSave
  }, [changes])

  const canUndo = historyIndex >= 0
  const canRedo = historyIndex < history.length - 1

  return {
    changes,
    hasUnsavedChanges,
    trackChange,
    undo,
    redo,
    undoAll,
    saveAll,
    canUndo,
    canRedo,
  }
}
