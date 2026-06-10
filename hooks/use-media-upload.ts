"use client"

import { useRef, useState, useCallback } from "react"
import imageCompression from "browser-image-compression"

interface UseMediaUploadOptions {
  onUpload: (url: string) => void
  onError?: (error: string) => void
  /** Max output size in MB. Defaults to 0.3 */
  maxSizeMB?: number
  /** Max longest side in px. Defaults to 1200 */
  maxWidthOrHeight?: number
}

/**
 * Client-side only upload hook.
 * Compresses the picked image with browser-image-compression and converts it
 * to a base64 data URL that can be stored directly in localStorage.
 * No server round-trip required.
 */
export function useMediaUpload({
  onUpload,
  onError,
  maxSizeMB = 0.3,
  maxWidthOrHeight = 1200,
}: UseMediaUploadOptions) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const openPicker = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Reset so the same file can be re-selected
      e.target.value = ""

      if (!file.type.startsWith("image/")) {
        onError?.("El archivo debe ser una imagen.")
        return
      }

      setUploading(true)
      try {
        // Compress client-side
        const compressed = await imageCompression(file, {
          maxSizeMB,
          maxWidthOrHeight,
          useWebWorker: true,
        })

        // Convert to base64 data URL — storable directly in localStorage
        const dataUrl = await imageCompression.getDataUrlFromFile(compressed)
        onUpload(dataUrl)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al procesar la imagen."
        onError?.(message)
      } finally {
        setUploading(false)
      }
    },
    [onUpload, onError, maxSizeMB, maxWidthOrHeight]
  )

  const inputProps = {
    ref: inputRef,
    type: "file" as const,
    accept: "image/*",
    className: "hidden",
    onChange: handleFileChange,
  }

  return { openPicker, uploading, inputProps }
}
