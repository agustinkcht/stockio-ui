"use client"

import type React from "react"

import { useState } from "react"
import { X, Building2, User } from "lucide-react"
import type { Cliente } from "@/lib/data/clientes"

interface NuevoClienteModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (cliente: Omit<Cliente, "id">) => void
}

const condicionesIva = ["Consumidor Final", "Responsable Inscripto", "Monotributista", "Exento"] as const

export function NuevoClienteModal({ isOpen, onClose, onSave }: NuevoClienteModalProps) {
  const [tipo, setTipo] = useState<"particular" | "empresa">("particular")
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [razonSocial, setRazonSocial] = useState("")
  const [cuit, setCuit] = useState("")
  const [dni, setDni] = useState("")
  const [idType, setIdType] = useState<"dni" | "cuit">("dni")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [direccion, setDireccion] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [provincia, setProvincia] = useState("")
  const [codigoPostal, setCodigoPostal] = useState("")
  const [condicionIva, setCondicionIva] = useState<Cliente["condicionIva"]>("Consumidor Final")

  const resetForm = () => {
    setTipo("particular")
    setNombre("")
    setApellido("")
    setRazonSocial("")
    setCuit("")
    setDni("")
    setIdType("dni")
    setEmail("")
    setTelefono("")
    setDireccion("")
    setCiudad("")
    setProvincia("")
    setCodigoPostal("")
    setCondicionIva("Consumidor Final")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const clienteData: Omit<Cliente, "id"> = {
      nombre,
      apellido,
      tipo,
      condicionIva,
      ...(tipo === "empresa" && razonSocial && { razonSocial }),
      ...(cuit && { cuit }),
      ...(dni && { dni }),
      ...(email && { email }),
      ...(telefono && { telefono }),
      ...(direccion && { direccion }),
      ...(ciudad && { ciudad }),
      ...(provincia && { provincia }),
      ...(codigoPostal && { codigoPostal }),
    }

    onSave(clienteData)
    resetForm()
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100010] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Nuevo Cliente</h2>
          <button onClick={handleClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
            {/* Tipo de Cliente */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Tipo de Cliente</label>
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

            {/* Identificación */}
            {tipo === "empresa" ? (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5">
                  CUIT <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={cuit}
                  onChange={handleCuitChange}
                  required
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="XX-XXXXXXXX-X"
                />
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-sm font-medium">Identificación</label>
                  <div className="flex items-center border border-border rounded-md overflow-hidden text-xs h-6">
                    <button
                      type="button"
                      onClick={() => { setIdType("dni"); setDni(""); setCuit("") }}
                      className={`px-2.5 h-full transition-colors cursor-pointer ${idType === "dni" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      DNI
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIdType("cuit"); setDni(""); setCuit("") }}
                      className={`px-2.5 h-full transition-colors cursor-pointer ${idType === "cuit" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      CUIT
                    </button>
                  </div>
                </div>
                {idType === "dni" ? (
                  <input
                    type="text"
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="12345678"
                  />
                ) : (
                  <input
                    type="text"
                    value={cuit}
                    onChange={handleCuitChange}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="XX-XXXXXXXX-X"
                  />
                )}
              </div>
            )}

            {/* Condición IVA */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5">
                Condición frente al IVA <span className="text-destructive">*</span>
              </label>
              <select
                value={condicionIva}
                onChange={(e) => setCondicionIva(e.target.value as Cliente["condicionIva"])}
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
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Crear Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
