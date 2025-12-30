"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Building2, User } from "lucide-react"
import type { Proveedor } from "@/lib/data/proveedores"

interface EditarProveedorModalProps {
  isOpen: boolean
  onClose: () => void
  proveedor: Proveedor | null
  onSave: (id: string, updates: Partial<Proveedor>) => void
}

const condicionesIva = ["Consumidor Final", "Responsable Inscripto", "Monotributista", "Exento"] as const

export function EditarProveedorModal({ isOpen, onClose, proveedor, onSave }: EditarProveedorModalProps) {
  const [tipo, setTipo] = useState<"particular" | "empresa">("particular")
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [razonSocial, setRazonSocial] = useState("")
  const [cuit, setCuit] = useState("")
  const [dni, setDni] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [direccion, setDireccion] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [provincia, setProvincia] = useState("")
  const [codigoPostal, setCodigoPostal] = useState("")
  const [condicionIva, setCondicionIva] = useState<Proveedor["condicionIva"]>("Consumidor Final")

  // Load proveedor data when modal opens
  useEffect(() => {
    if (proveedor && isOpen) {
      setTipo(proveedor.tipo)
      setNombre(proveedor.nombre)
      setApellido(proveedor.apellido)
      setRazonSocial(proveedor.razonSocial || "")
      setCuit(proveedor.cuit || "")
      setDni(proveedor.dni || "")
      setEmail(proveedor.email || "")
      setTelefono(proveedor.telefono || "")
      setDireccion(proveedor.direccion || "")
      setCiudad(proveedor.ciudad || "")
      setProvincia(proveedor.provincia || "")
      setCodigoPostal(proveedor.codigoPostal || "")
      setCondicionIva(proveedor.condicionIva)
    }
  }, [proveedor, isOpen])

  const handleClose = () => {
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!proveedor) return

    const updates: Partial<Proveedor> = {
      nombre,
      apellido,
      tipo,
      condicionIva,
      razonSocial: tipo === "empresa" && razonSocial ? razonSocial : undefined,
      cuit: cuit || undefined,
      dni: dni || undefined,
      email: email || undefined,
      telefono: telefono || undefined,
      direccion: direccion || undefined,
      ciudad: ciudad || undefined,
      provincia: provincia || undefined,
      codigoPostal: codigoPostal || undefined,
    }

    onSave(proveedor.id, updates)
    onClose()
  }

  const handleDiscard = () => {
    // Reset to original values
    if (proveedor) {
      setTipo(proveedor.tipo)
      setNombre(proveedor.nombre)
      setApellido(proveedor.apellido)
      setRazonSocial(proveedor.razonSocial || "")
      setCuit(proveedor.cuit || "")
      setDni(proveedor.dni || "")
      setEmail(proveedor.email || "")
      setTelefono(proveedor.telefono || "")
      setDireccion(proveedor.direccion || "")
      setCiudad(proveedor.ciudad || "")
      setProvincia(proveedor.provincia || "")
      setCodigoPostal(proveedor.codigoPostal || "")
      setCondicionIva(proveedor.condicionIva)
    }
    onClose()
  }

  const formatCuit = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 10) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 10)}-${numbers.slice(10, 11)}`
  }

  const handleCuitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCuit(e.target.value)
    if (formatted.replace(/\D/g, "").length <= 11) {
      setCuit(formatted)
    }
  }

  if (!isOpen || !proveedor) return null

  return (
    <div className="fixed inset-0 z-[100010] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleDiscard} />

      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Editar Proveedor</h2>
          <button onClick={handleDiscard} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
            {/* Tipo de Proveedor */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Tipo de Proveedor</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setTipo("particular")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    tipo === "particular"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Particular</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipo("empresa")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                    tipo === "empresa"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span className="font-medium">Empresa</span>
                </button>
              </div>
            </div>

            {/* Razón Social (solo empresa) */}
            {tipo === "empresa" && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5">
                  Razón Social <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  required={tipo === "empresa"}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Nombre de la empresa"
                />
              </div>
            )}

            {/* Nombre y Apellido (solo particulares) */}
            {tipo === "particular" && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Nombre <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Apellido <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Apellido"
                  />
                </div>
              </div>
            )}

            {/* CUIT y DNI */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  CUIT {tipo === "empresa" && <span className="text-destructive">*</span>}
                </label>
                <input
                  type="text"
                  value={cuit}
                  onChange={handleCuitChange}
                  required={tipo === "empresa"}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="XX-XXXXXXXX-X"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">DNI</label>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="12345678"
                />
              </div>
            </div>

            {/* Condición IVA */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5">
                Condición frente al IVA <span className="text-destructive">*</span>
              </label>
              <select
                value={condicionIva}
                onChange={(e) => setCondicionIva(e.target.value as Proveedor["condicionIva"])}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                {condicionesIva.map((condicion) => (
                  <option key={condicion} value={condicion}>
                    {condicion}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-px bg-border my-5" />

            {/* Contacto */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="+54 11 1234-5678"
                />
              </div>
            </div>

            <div className="h-px bg-border my-5" />

            {/* Domicilio Fiscal */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5">Domicilio Fiscal</label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Av. Corrientes 1234, Piso 5, Dpto A"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Ciudad</label>
                <input
                  type="text"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Buenos Aires"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Provincia</label>
                <input
                  type="text"
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="CABA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Código Postal</label>
                <input
                  type="text"
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="1043"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Descartar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
