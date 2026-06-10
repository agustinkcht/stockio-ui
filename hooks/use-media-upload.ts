"use client"

import { useRef, useState, useCallback } from "react"
import imageCompression from "browser-image-compression"

interface UseMediaUploadOptions {
  onUpload: (url: string) => void
  onError?: (error: string) => void
  maxSizeMB?: number
  maxWidthOrHeight?: number
}

export function useMediaUpload({
  onUpload,
  onError,
  maxSizeMB = 0.5,
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

      // Reset so the same file can be re-selected if needed
      e.target.value = ""

      setUploading(true)
      try {
        // Compress client-side before upload
        const compressed = await imageCompression(file, {
          maxSizeMB,
          maxWidthOrHeight,
          useWebWorker: true,
        })

        const formData = new FormData()
        formData.append("file", compressed, file.name)

        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const { error } = await res.json()
          throw new Error(error || "Upload failed")
        }

        const { url } = await res.json()
        onUpload(url)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed"
        onError?.(message)
      } finally {
        setUploading(false)
      }
    },
    [onUpload, onError, maxSizeMB, maxWidthOrHeight]
  )

  // Render this input somewhere in the tree (hidden)
  const inputProps = {
    ref: inputRef,
    type: "file" as const,
    accept: "image/*",
    className: "hidden",
    onChange: handleFileChange,
  }

  return { openPicker, uploading, inputProps }
}
