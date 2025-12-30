"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    router.push("/inventario/articulos")
  }, [router])

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <p>Cargando...</p>
    </div>
  )
}
