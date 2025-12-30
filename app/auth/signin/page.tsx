"use client"

import type React from "react"
import { useState } from "react"
import { Eye, EyeOff, LogIn } from "lucide-react"
import Image from "next/image"
import { useAccount } from "@/lib/contexts/account-context"
import { verifyPassword } from "@/lib/data/users"

export default function SignInPage() {
  const { switchAccount } = useAccount()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!verifyPassword(password, email)) {
      setError("Credenciales inválidas")
      return
    }

    // Determine which account to switch to based on email
    if (email === "admin@invino.com") {
      switchAccount("invino")
    } else if (email === "admin@noire.com") {
      switchAccount("noire")
    } else {
      setError("Usuario no encontrado")
    }
  }

  const handleQuickSwitch = (account: "invino" | "noire") => {
    console.log("[v0] Quick switching to:", account)
    switchAccount(account)
  }

  return (
    <div className="min-h-screen bg-[rgb(243,242,238)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-foreground rounded-2xl mb-4">
            <Image src="/images/logo.png" alt="Stockio" width={40} height={40} className="invert" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Stockio</h1>
          <p className="text-sm text-muted-foreground mt-1">Suite de Negocio</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-8">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-foreground">Iniciar Sesión</h2>
            <p className="text-sm text-muted-foreground mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@invino.com"
                className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 pr-11 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-11 bg-foreground hover:bg-foreground/90 text-background rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
            >
              <LogIn className="w-5 h-5" />
              Iniciar Sesión
            </button>
          </form>

          {/* Account Switchers */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Ingresar como:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickSwitch("invino")}
                className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 transition-all"
              >
                <Image src="/images/users/invino.jpg" alt="In Vino" width={32} height={32} className="rounded-md" />
                <div className="text-left">
                  <p className="text-xs font-medium text-foreground">In Vino</p>
                  <p className="text-[10px] text-muted-foreground">190 items</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSwitch("noire")}
                className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 transition-all"
              >
                <Image src="/images/users/noire.jpg" alt="NOIRE" width={32} height={32} className="rounded-md" />
                <div className="text-left">
                  <p className="text-xs font-medium text-foreground">NOIRE</p>
                  <p className="text-[10px] text-muted-foreground">Vacío</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center mt-6">© 2025 Stockio. Todos los derechos reservados.</p>
      </div>
    </div>
  )
}
