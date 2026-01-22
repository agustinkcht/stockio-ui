'use client';

import { useEffect, useCallback, useRef, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface NavigationGuardOptions {
  hasUnsavedChanges: boolean
  onSave: () => Promise<void>
  onDiscard: () => void
}

export function useNavigationGuard({ hasUnsavedChanges, onSave, onDiscard }: NavigationGuardOptions) {
  const router = useRouter()
  const pathname = usePathname()
  const [showModal, setShowModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const originalPushRef = useRef<typeof router.push>()
  
  // Intercept navigation
  useEffect(() => {
    if (!originalPushRef.current) {
      originalPushRef.current = router.push
    }

    if (hasUnsavedChanges) {
      // Override router.push to intercept navigation
      router.push = ((href: string) => {
        if (href !== pathname) {
          setPendingNavigation(href)
          setShowModal(true)
          return Promise.resolve(true)
        }
        return originalPushRef.current!(href)
      }) as typeof router.push
    } else {
      // Restore original push when no unsaved changes
      if (originalPushRef.current) {
        router.push = originalPushRef.current
      }
    }

    // Cleanup
    return () => {
      if (originalPushRef.current) {
        router.push = originalPushRef.current
      }
    }
  }, [hasUnsavedChanges, pathname, router])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleSave = useCallback(async () => {
    await onSave()
    setShowModal(false)
    if (pendingNavigation && originalPushRef.current) {
      originalPushRef.current(pendingNavigation)
    }
    setPendingNavigation(null)
  }, [onSave, pendingNavigation])

  const handleDiscard = useCallback(() => {
    onDiscard()
    setShowModal(false)
    if (pendingNavigation && originalPushRef.current) {
      originalPushRef.current(pendingNavigation)
    }
    setPendingNavigation(null)
  }, [onDiscard, pendingNavigation])

  const handleCancel = useCallback(() => {
    setShowModal(false)
    setPendingNavigation(null)
  }, [])

  return {
    showNavigationModal: showModal,
    handleSaveAndNavigate: handleSave,
    handleDiscardAndNavigate: handleDiscard,
    handleCancelNavigation: handleCancel,
  }
}
