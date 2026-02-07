"use client"

import { useState, useMemo } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { UserPanel } from "@/components/layout/user-panel"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { useSidebar } from "@/hooks/use-sidebar"
import { useCaja } from "@/hooks/use-caja"
import { SIDEBAR_ITEMS, BOTTOM_SIDEBAR_ITEMS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import type { CajaSesion, CajaMovimiento } from "@/lib/types"
import {
  Play,
  Square,
  ArrowDownCircle,
  ArrowUpCircle,
  Vault,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Clock,
  AlertTriangle,
  X,
  History,
  ChevronLeft,
  Eye,
  Plus,
} from "lucide-react"

// ─── Format helpers ─────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
}

// ─── Movement timeline icon + color ────────────────────────
function movMeta(mov: CajaMovimiento) {
  switch (mov.tipo) {
    case "venta_efectivo":
      return { icon: Banknote, color: "text-green-600", bg: "bg-green-50", sign: "+", label: `Venta POS ${mov.ventaId || ""}`, tagLabel: "efectivo", tagColor: "bg-green-100 text-green-700" }
    case "venta_posnet":
      return { icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50", sign: "+", label: `Venta POS ${mov.ventaId || ""}`, tagLabel: "posnet", tagColor: "bg-blue-100 text-blue-700" }
    case "venta_transferencia":
      return { icon: ArrowRightLeft, color: "text-violet-600", bg: "bg-violet-50", sign: "+", label: `Venta POS ${mov.ventaId || ""}`, tagLabel: "transferencia", tagColor: "bg-violet-100 text-violet-700" }
    case "ingreso":
      return { icon: ArrowDownCircle, color: "text-green-600", bg: "bg-green-50", sign: "+", label: mov.descripcion, tagLabel: "efectivo", tagColor: "bg-green-100 text-green-700" }
    case "egreso":
      return { icon: ArrowUpCircle, color: "text-red-500", bg: "bg-red-50", sign: "-", label: mov.descripcion, tagLabel: "efectivo", tagColor: "bg-red-100 text-red-600" }
    case "retiro":
      return { icon: Vault, color: "text-amber-600", bg: "bg-amber-50", sign: "-", label: "Retiro de efectivo", tagLabel: "efectivo", tagColor: "bg-amber-100 text-amber-700" }
    case "correctivo":
      return { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", sign: mov.monto >= 0 ? "+" : "", label: "Movimiento correctivo", tagLabel: "correctivo", tagColor: "bg-orange-100 text-orange-700" }
    default:
      return { icon: Banknote, color: "text-gray-500", bg: "bg-gray-50", sign: "", label: mov.descripcion, tagLabel: "", tagColor: "" }
  }
}

// ─── Modal shell ───────────────────────────────────────────
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

// ─── Timeline component ────────────────────────────────────
function Timeline({ movimientos, showCorrectivos = false }: { movimientos: CajaMovimiento[]; showCorrectivos?: boolean }) {
  const sorted = [...movimientos].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Clock className="w-8 h-8 mb-3 opacity-50" />
        <p className="text-sm">Sin movimientos</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {sorted.map((mov, i) => {
        const meta = movMeta(mov)
        const IconComp = meta.icon
        const isNeg = mov.tipo === "egreso" || mov.tipo === "retiro"
        const isCorrectivo = mov.tipo === "correctivo"

        return (
          <div
            key={mov.id}
            className={`flex items-start gap-4 px-5 py-3.5 ${i < sorted.length - 1 ? "border-b border-gray-100" : ""} ${isCorrectivo ? "bg-orange-50/40" : "hover:bg-gray-50/60"} transition-colors`}
          >
            {/* Time */}
            <span className="text-xs text-gray-400 font-mono w-12 pt-0.5 flex-shrink-0">
              {fmtTime(mov.timestamp)}
            </span>

            {/* Icon */}
            <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
              <IconComp className={`w-4 h-4 ${meta.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800 truncate">{meta.label}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${meta.tagColor}`}>
                  {meta.tagLabel}
                </span>
              </div>
              {(mov.nota || mov.motivo) && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {mov.usuario}{mov.nota ? ` \u00B7 ${mov.nota}` : ""}{mov.motivo ? ` \u00B7 ${mov.motivo}` : ""}
                </p>
              )}
            </div>

            {/* Amount */}
            <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${isNeg ? "text-red-500" : (mov.monto < 0 ? "text-red-500" : "text-gray-800")}`}>
              {meta.sign}{fmt(Math.abs(mov.monto))}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Session History View ──────────────────────────────────
function HistorialView({ sesiones, onBack, onRevisar }: { sesiones: CajaSesion[]; onBack: () => void; onRevisar: (s: CajaSesion) => void }) {
  const closed = sesiones.filter((s) => s.estado === "cerrada").sort((a, b) => b.id - a.id)

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <h2 className="text-sm font-semibold text-gray-800">Historial de Sesiones</h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {closed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <History className="w-8 h-8 mb-3 opacity-50" />
            <p className="text-sm">Sin sesiones anteriores</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {closed.map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gray-500">#{s.id}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">Sesion #{s.id}</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">cerrada</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {fmtDate(s.timestampApertura)} {fmtTime(s.timestampApertura)} - {s.timestampCierre ? fmtTime(s.timestampCierre) : ""} {"\u00B7"} {s.responsable}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 mr-3">
                  <p className="text-sm font-semibold text-gray-800">{fmt(s.cierre?.saldoContadoEfectivo || 0)}</p>
                  <p className={`text-xs ${(s.cierre?.diferenciaEfectivo || 0) === 0 ? "text-gray-400" : (s.cierre?.diferenciaEfectivo || 0) > 0 ? "text-green-600" : "text-red-500"}`}>
                    Dif: {fmt(s.cierre?.diferenciaEfectivo || 0)}
                  </p>
                </div>
                <button onClick={() => onRevisar(s)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <Eye className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Session Review View ───────────────────────────────────
function ReviewView({ sesion, onBack, onAddCorrectivo }: { sesion: CajaSesion; onBack: () => void; onAddCorrectivo: (sesionId: number, monto: number, descripcion: string, nota: string) => void }) {
  const [showCorrectivoModal, setShowCorrectivoModal] = useState(false)
  const [correctivoMonto, setCorrectivoMonto] = useState("")
  const [correctivoDesc, setCorrectivoDesc] = useState("")
  const [correctivoNota, setCorrectivoNota] = useState("")
  const [correctivoSign, setCorrectivoSign] = useState<"positive" | "negative" | "retiro">("positive")

  const handleAddCorrectivo = () => {
    const m = parseFloat(correctivoMonto) || 0
    if (m === 0) return
    const signedMonto = correctivoSign === "positive" ? m : -m
    const desc = correctivoSign === "retiro"
      ? correctivoDesc || "Retiro de efectivo (correctivo)"
      : correctivoDesc || "Movimiento correctivo"
    onAddCorrectivo(sesion.id, signedMonto, desc, correctivoNota)
    setShowCorrectivoModal(false)
    setCorrectivoMonto("")
    setCorrectivoDesc("")
    setCorrectivoNota("")
  }

  // Recalculate saldos from movimientos
  let efectivo = sesion.apertura.saldoInicialContado
  let posnet = 0
  let transferencia = 0
  for (const m of sesion.movimientos) {
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

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Sesion #{sesion.id}</h2>
            <p className="text-xs text-gray-400">{fmtDate(sesion.timestampApertura)} {"\u00B7"} {sesion.responsable}</p>
          </div>
        </div>
        <Button
          onClick={() => setShowCorrectivoModal(true)}
          variant="ghost"
          size="sm"
          className="h-8 text-xs border border-orange-200 text-orange-600 hover:bg-orange-50 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Correctivo
        </Button>
      </div>

      {/* Summary widgets */}
      <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-gray-100">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Efectivo</p>
          <p className="text-base font-bold text-gray-800">{fmt(efectivo)}</p>
          {sesion.cierre && (
            <p className={`text-xs mt-0.5 ${sesion.cierre.diferenciaEfectivo === 0 ? "text-gray-400" : sesion.cierre.diferenciaEfectivo > 0 ? "text-green-600" : "text-red-500"}`}>
              Contado: {fmt(sesion.cierre.saldoContadoEfectivo)} ({sesion.cierre.diferenciaEfectivo >= 0 ? "+" : ""}{fmt(sesion.cierre.diferenciaEfectivo)})
            </p>
          )}
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Posnet</p>
          <p className="text-base font-bold text-gray-800">{fmt(posnet)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Transferencia</p>
          <p className="text-base font-bold text-gray-800">{fmt(transferencia)}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        <Timeline movimientos={sesion.movimientos} showCorrectivos />
      </div>

      {/* Correctivo Modal */}
      {showCorrectivoModal && (
        <Modal onClose={() => setShowCorrectivoModal(false)}>
          <div className="px-6 py-5">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Movimiento Correctivo</h3>
            <p className="text-xs text-gray-400 mb-4">
              Se agregara como correctivo explicito a la sesion #{sesion.id}.
            </p>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setCorrectivoSign("positive")}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${correctivoSign === "positive" ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}
              >
                + Ingreso
              </button>
              <button
                onClick={() => setCorrectivoSign("negative")}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${correctivoSign === "negative" ? "bg-red-100 text-red-600 border border-red-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}
              >
                - Egreso
              </button>
              <button
                onClick={() => setCorrectivoSign("retiro")}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${correctivoSign === "retiro" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}
              >
                - Retiro
              </button>
            </div>

            <label className="block text-xs text-gray-500 mb-1">Monto</label>
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={correctivoMonto}
                onChange={(e) => setCorrectivoMonto(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="0"
                autoFocus
              />
            </div>

            <label className="block text-xs text-gray-500 mb-1">Descripcion</label>
            <input
              value={correctivoDesc}
              onChange={(e) => setCorrectivoDesc(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 mb-3"
              placeholder="Motivo del correctivo"
            />

            <label className="block text-xs text-gray-500 mb-1">Nota (opcional)</label>
            <input
              value={correctivoNota}
              onChange={(e) => setCorrectivoNota(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 mb-5"
              placeholder="Nota adicional"
            />
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="ghost" size="sm" onClick={() => setShowCorrectivoModal(false)} className="text-xs cursor-pointer">Cancelar</Button>
            <Button size="sm" onClick={handleAddCorrectivo} disabled={!correctivoMonto || parseFloat(correctivoMonto) === 0} className="text-xs cursor-pointer">Guardar</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════
export default function CajaPage() {
  const { hoveredDropdown, handleDropdownMouseEnter, handleDropdownMouseLeave, handleCloseDropdowns } = useSidebar()
  const {
    sesiones,
    sesionActiva,
    ultimaSesionCerrada,
    isLoading,
    calcularSaldoEsperado,
    iniciarSesion,
    cerrarSesion,
    agregarMovimiento,
    agregarCorrectivo,
  } = useCaja()

  // View state
  const [view, setView] = useState<"main" | "historial" | "review">("main")
  const [reviewSesion, setReviewSesion] = useState<CajaSesion | null>(null)

  // Modal state
  const [showIniciarModal, setShowIniciarModal] = useState(false)
  const [showIniciarConfirm, setShowIniciarConfirm] = useState(false)
  const [showCerrarModal, setShowCerrarModal] = useState(false)
  const [showCerrarResumen, setShowCerrarResumen] = useState(false)
  const [showCerrarFinal, setShowCerrarFinal] = useState(false)
  const [showSuccess, setShowSuccess] = useState<string | null>(null)

  // Ingreso / Egreso / Retiro modals
  const [showIngresoModal, setShowIngresoModal] = useState(false)
  const [showEgresoModal, setShowEgresoModal] = useState(false)
  const [showRetiroModal, setShowRetiroModal] = useState(false)

  // Form state
  const [saldoContadoInput, setSaldoContadoInput] = useState("")
  const [movMonto, setMovMonto] = useState("")
  const [movMotivo, setMovMotivo] = useState("")
  const [movNota, setMovNota] = useState("")
  const [retiroContado, setRetiroContado] = useState("")

  // Computed values
  const saldoContadoNum = parseFloat(saldoContadoInput) || 0
  const saldoInicialEsperado = ultimaSesionCerrada?.cierre?.saldoContadoEfectivo || 0
  const diferenciaInicial = saldoContadoNum - saldoInicialEsperado

  const saldos = useMemo(() => {
    if (!sesionActiva) return { efectivo: 0, posnet: 0, transferencia: 0 }
    return calcularSaldoEsperado(sesionActiva)
  }, [sesionActiva, calcularSaldoEsperado])

  const nextSessionId = sesiones.length > 0 ? Math.max(...sesiones.map((s) => s.id)) + 1 : 1

  // Cerrar state
  const [cerrarSaldoContado, setCerrarSaldoContado] = useState("")
  const cerrarSaldoContadoNum = parseFloat(cerrarSaldoContado) || 0
  const cerrarDiferencia = cerrarSaldoContadoNum - saldos.efectivo

  // ─── Handlers ──────────────────────────────────────────────

  const handleIniciar = () => {
    setShowIniciarModal(true)
    setSaldoContadoInput("")
  }

  const handleIniciarNext = () => {
    setShowIniciarModal(false)
    setShowIniciarConfirm(true)
  }

  const handleIniciarConfirm = () => {
    iniciarSesion(saldoContadoNum)
    setShowIniciarConfirm(false)
    setSaldoContadoInput("")
    setShowSuccess("Caja iniciada con exito")
    setTimeout(() => setShowSuccess(null), 2500)
  }

  const handleCerrar = () => {
    setCerrarSaldoContado("")
    setShowCerrarModal(true)
  }

  const handleCerrarNext = () => {
    setShowCerrarModal(false)
    setShowCerrarResumen(true)
  }

  const handleCerrarConfirm = () => {
    setShowCerrarResumen(false)
    setShowCerrarFinal(true)
  }

  const handleCerrarFinal = () => {
    cerrarSesion(cerrarSaldoContadoNum)
    setShowCerrarFinal(false)
    setCerrarSaldoContado("")
    setShowSuccess("Caja cerrada con exito")
    setTimeout(() => setShowSuccess(null), 2500)
  }

  const handleIngreso = () => {
    const m = parseFloat(movMonto) || 0
    if (m <= 0) return
    agregarMovimiento({
      tipo: "ingreso",
      monto: m,
      descripcion: "Ingreso manual",
      motivo: movMotivo || undefined,
      nota: movNota || undefined,
      medioPago: "efectivo",
    })
    setShowIngresoModal(false)
    resetMovForm()
  }

  const handleEgreso = () => {
    const m = parseFloat(movMonto) || 0
    if (m <= 0) return
    agregarMovimiento({
      tipo: "egreso",
      monto: m,
      descripcion: "Egreso manual",
      motivo: movMotivo || undefined,
      nota: movNota || undefined,
      medioPago: "efectivo",
    })
    setShowEgresoModal(false)
    resetMovForm()
  }

  const handleRetiro = () => {
    const m = parseFloat(movMonto) || 0
    if (m <= 0) return
    agregarMovimiento({
      tipo: "retiro",
      monto: m,
      descripcion: "Retiro de efectivo",
      nota: movNota || undefined,
      medioPago: "efectivo",
    })
    setShowRetiroModal(false)
    resetMovForm()
  }

  const resetMovForm = () => {
    setMovMonto("")
    setMovMotivo("")
    setMovNota("")
    setRetiroContado("")
  }

  const handleRevisar = (s: CajaSesion) => {
    setReviewSesion(s)
    setView("review")
  }

  const handleAddCorrectivo = (sesionId: number, monto: number, descripcion: string, nota: string) => {
    agregarCorrectivo(sesionId, {
      monto,
      descripcion,
      nota: nota || undefined,
      medioPago: "efectivo",
    })
    // Refresh the review sesion
    const updated = sesiones.find((s) => s.id === sesionId)
    if (updated) setReviewSesion({ ...updated })
  }

  // Breadcrumbs
  const breadcrumbs = [{ label: "Mi Negocio" }, { label: "Caja", href: "/mi-negocio/caja" }]

  // ─── Render ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[rgb(243,242,238)]">
        <div className="px-[6px] py-[6px] flex gap-[6px] h-screen items-center justify-center">
          <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-gray-400 rounded-full animate-loading-bar" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[rgb(243,242,238)]">
      <div className="px-[6px] py-[6px] flex gap-[6px] h-screen" onClick={handleCloseDropdowns}>
        {/* Sidebar */}
        <div onClick={(e) => e.stopPropagation()} className="relative h-[calc(100vh-12px)] sticky top-[6px] z-[100003]">
          <Sidebar
            sidebarItems={SIDEBAR_ITEMS}
            bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
            hoveredDropdown={hoveredDropdown}
            onDropdownOpen={handleDropdownMouseEnter}
            onDropdownClose={handleDropdownMouseLeave}
          />
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">
          {/* Top bar */}
          <div className="relative border-b border-border h-[44px] bg-white z-[100004]">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3 mt-0">
                <UserPanel />
              </div>
              <div className="flex items-center gap-2 min-w-[280px] justify-end" />
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

            {/* ── HISTORIAL VIEW ─────────────────────────── */}
            {view === "historial" && (
              <HistorialView
                sesiones={sesiones}
                onBack={() => setView("main")}
                onRevisar={handleRevisar}
              />
            )}

            {/* ── REVIEW VIEW ────────────────────────────── */}
            {view === "review" && reviewSesion && (
              <ReviewView
                sesion={sesiones.find((s) => s.id === reviewSesion.id) || reviewSesion}
                onBack={() => { setView("historial"); setReviewSesion(null) }}
                onAddCorrectivo={handleAddCorrectivo}
              />
            )}

            {/* ── MAIN VIEW ──────────────────────────────── */}
            {view === "main" && !sesionActiva && (
              /* ─── STATE 1: SESION INACTIVA ──────────────── */
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                  <Vault className="w-7 h-7 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">No hay caja abierta</h2>

                {ultimaSesionCerrada ? (
                  <div className="text-center mb-6">
                    <p className="text-xs text-gray-400 mt-2">
                      Ultima sesion: <span className="font-medium text-gray-500">#{ultimaSesionCerrada.id}</span>
                      {" "}{"\u00B7"}{" "}{fmtDate(ultimaSesionCerrada.timestampCierre || ultimaSesionCerrada.timestampApertura)}
                      {" "}{"\u00B7"}{" "}
                      <span className="font-medium text-gray-500">{ultimaSesionCerrada.estado}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Saldo final: <span className="font-medium text-gray-600">{fmt(ultimaSesionCerrada.cierre?.saldoContadoEfectivo || 0)}</span>
                    </p>

                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button
                        onClick={() => handleRevisar(ultimaSesionCerrada)}
                        className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 cursor-pointer transition-colors"
                      >
                        Revisar
                      </button>
                      <span className="text-gray-300">{"\u00B7"}</span>
                      <button
                        onClick={() => setView("historial")}
                        className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 cursor-pointer transition-colors"
                      >
                        Historial de sesiones
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-6 mt-1">No hay sesiones anteriores</p>
                )}

                <Button
                  onClick={handleIniciar}
                  size="sm"
                  className="px-6 h-9 text-sm font-medium cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 mr-2" />
                  Iniciar Caja
                </Button>
              </div>
            )}

            {view === "main" && sesionActiva && (
              /* ─── STATE 3: SESION ACTIVA ────────────────── */
              <div className="flex-1 flex flex-col min-h-0">

                {/* Widgets */}
                <div className="grid grid-cols-3 gap-3 px-5 pt-5 pb-3">
                  {/* Efectivo - highlighted */}
                  <div className="bg-gray-900 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Banknote className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">Efectivo</p>
                    </div>
                    <p className="text-xl font-bold">{fmt(saldos.efectivo)}</p>
                  </div>
                  {/* Posnet */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">Posnet</p>
                    </div>
                    <p className="text-xl font-bold text-gray-800">{fmt(saldos.posnet)}</p>
                  </div>
                  {/* Transferencia */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-[10px] uppercase tracking-wider text-gray-400">Transferencia</p>
                    </div>
                    <p className="text-xl font-bold text-gray-800">{fmt(saldos.transferencia)}</p>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 px-5 pb-3">
                  <Button
                    onClick={() => { resetMovForm(); setShowIngresoModal(true) }}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs border border-green-200 text-green-700 hover:bg-green-50 cursor-pointer"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5 mr-1.5" />
                    Ingreso
                  </Button>
                  <Button
                    onClick={() => { resetMovForm(); setShowEgresoModal(true) }}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5 mr-1.5" />
                    Egreso
                  </Button>
                  <Button
                    onClick={() => { resetMovForm(); setShowRetiroModal(true) }}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs border border-amber-200 text-amber-700 hover:bg-amber-50 cursor-pointer"
                  >
                    <Vault className="w-3.5 h-3.5 mr-1.5" />
                    Retirar Efectivo
                  </Button>
                  <div className="flex-1" />
                  <Button
                    onClick={handleCerrar}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs border border-gray-200 text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    <Square className="w-3 h-3 mr-1.5" />
                    Cerrar Caja
                  </Button>
                </div>

                {/* Live indicator + Timeline */}
                <div className="flex-1 border-t border-gray-100 flex flex-col min-h-0">
                  {/* Live badge */}
                  <div className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-live-pulse absolute inline-flex h-full w-full rounded-full bg-green-500" />
                    </span>
                    <span className="text-xs font-medium text-gray-700">Sesion activa</span>
                    <span className="text-xs text-gray-400">{"\u00B7"}</span>
                    <span className="text-xs text-gray-400">{sesionActiva.responsable}</span>
                    <span className="text-xs text-gray-400 ml-auto">#{sesionActiva.id} {"\u00B7"} Desde {fmtTime(sesionActiva.timestampApertura)}</span>
                  </div>

                  {/* Timeline */}
                  <div className="flex-1 overflow-y-auto">
                    <Timeline movimientos={sesionActiva.movimientos} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MODALS ═══════════════════════════════════════════ */}

      {/* SUCCESS TOAST */}
      {showSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] animate-fade-out">
          <div className="bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg">
            {showSuccess}
          </div>
        </div>
      )}

      {/* INICIAR CAJA - Step 1 */}
      {showIniciarModal && (
        <Modal onClose={() => setShowIniciarModal(false)}>
          <div className="px-6 py-5">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Iniciar Caja</h3>

            <div className="flex items-center justify-between py-2.5 mb-3">
              <span className="text-sm text-gray-500">Saldo inicial esperado</span>
              <span className="text-sm font-semibold text-gray-800">{fmt(saldoInicialEsperado)}</span>
            </div>

            <label className="block text-xs text-gray-500 mb-1">Cuanto efectivo hay en la caja?</label>
            <div className="relative mb-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={saldoContadoInput}
                onChange={(e) => setSaldoContadoInput(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="Saldo inicial contado"
                autoFocus
              />
            </div>
            {saldoContadoInput && (
              <p className={`text-xs mb-3 ${diferenciaInicial === 0 ? "text-gray-400" : diferenciaInicial > 0 ? "text-green-600" : "text-red-500"}`}>
                Diferencia: {diferenciaInicial >= 0 ? "+" : ""}{fmt(diferenciaInicial)}
              </p>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="ghost" size="sm" onClick={() => setShowIniciarModal(false)} className="text-xs cursor-pointer">Cancelar</Button>
            <Button size="sm" onClick={handleIniciarNext} disabled={!saldoContadoInput} className="text-xs cursor-pointer">Aceptar</Button>
          </div>
        </Modal>
      )}

      {/* INICIAR CAJA - Step 2 Confirm */}
      {showIniciarConfirm && (
        <Modal onClose={() => setShowIniciarConfirm(false)}>
          <div className="px-6 py-5">
            <h3 className="text-base font-semibold text-gray-800 mb-1">Vas a iniciar una nueva sesion de caja</h3>
            <div className="mt-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sesion</span>
                <span className="font-semibold text-gray-800">#{nextSessionId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Saldo inicial esperado</span>
                <span className="font-medium text-gray-700">{fmt(saldoInicialEsperado)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Saldo inicial contado</span>
                <span className="font-medium text-gray-700">{fmt(saldoContadoNum)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-100 pt-2.5">
                <span className="text-gray-500">Diferencia inicial</span>
                <span className={`font-semibold ${diferenciaInicial === 0 ? "text-gray-600" : diferenciaInicial > 0 ? "text-green-600" : "text-red-500"}`}>
                  {diferenciaInicial >= 0 ? "+" : ""}{fmt(diferenciaInicial)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="ghost" size="sm" onClick={() => { setShowIniciarConfirm(false); setShowIniciarModal(true) }} className="text-xs cursor-pointer">Revisar</Button>
            <Button size="sm" onClick={handleIniciarConfirm} className="text-xs cursor-pointer">
              <Play className="w-3 h-3 mr-1.5" />
              Iniciar Caja
            </Button>
          </div>
        </Modal>
      )}

      {/* CERRAR CAJA - Step 1 */}
      {showCerrarModal && (
        <Modal onClose={() => setShowCerrarModal(false)}>
          <div className="px-6 py-5">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Cerrar Caja</h3>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Saldo esperado en efectivo</span>
                <span className="font-semibold text-gray-800">{fmt(saldos.efectivo)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Posnet</span>
                <span className="font-medium text-gray-700">{fmt(saldos.posnet)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Transferencia</span>
                <span className="font-medium text-gray-700">{fmt(saldos.transferencia)}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-xs text-gray-500 mb-1">Cuanto dinero hay en caja?</label>
              <div className="relative mb-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={cerrarSaldoContado}
                  onChange={(e) => setCerrarSaldoContado(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                  placeholder="Saldo contado"
                  autoFocus
                />
              </div>
              {cerrarSaldoContado && (
                <p className={`text-xs ${cerrarDiferencia === 0 ? "text-gray-400" : cerrarDiferencia > 0 ? "text-green-600" : "text-red-500"}`}>
                  Diferencia: {cerrarDiferencia >= 0 ? "+" : ""}{fmt(cerrarDiferencia)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="ghost" size="sm" onClick={() => setShowCerrarModal(false)} className="text-xs cursor-pointer">Cancelar</Button>
            <Button size="sm" onClick={handleCerrarNext} disabled={!cerrarSaldoContado} className="text-xs cursor-pointer">Aceptar</Button>
          </div>
        </Modal>
      )}

      {/* CERRAR CAJA - Step 2 Resumen */}
      {showCerrarResumen && (
        <Modal onClose={() => setShowCerrarResumen(false)}>
          <div className="px-6 py-5">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Resumen de la sesion</h3>

            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Saldo esperado en efectivo</span>
                <span className="font-medium text-gray-700">{fmt(saldos.efectivo)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Saldo contado en efectivo</span>
                <span className="font-medium text-gray-700">{fmt(cerrarSaldoContadoNum)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-100 pt-2.5">
                <span className="text-gray-500">Diferencia</span>
                <span className={`font-semibold ${cerrarDiferencia === 0 ? "text-gray-600" : cerrarDiferencia > 0 ? "text-green-600" : "text-red-500"}`}>
                  {cerrarDiferencia >= 0 ? "+" : ""}{fmt(cerrarDiferencia)}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-2.5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Posnet</span>
                  <span className="font-medium text-gray-700">{fmt(saldos.posnet)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Transferencia</span>
                  <span className="font-medium text-gray-700">{fmt(saldos.transferencia)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="ghost" size="sm" onClick={() => { setShowCerrarResumen(false); setShowCerrarModal(true) }} className="text-xs cursor-pointer">Cancelar</Button>
            <Button size="sm" onClick={handleCerrarConfirm} className="text-xs cursor-pointer">
              <Square className="w-3 h-3 mr-1.5" />
              Cerrar Caja
            </Button>
          </div>
        </Modal>
      )}

      {/* CERRAR CAJA - Step 3 Final confirmation */}
      {showCerrarFinal && (
        <Modal onClose={() => setShowCerrarFinal(false)}>
          <div className="px-6 py-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Square className="w-5 h-5 text-gray-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">Vas a cerrar la caja</h3>
            <p className="text-sm text-gray-400">Sesion #{sesionActiva?.id}</p>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="ghost" size="sm" onClick={() => { setShowCerrarFinal(false); setShowCerrarResumen(true) }} className="text-xs cursor-pointer">Cancelar</Button>
            <Button size="sm" onClick={handleCerrarFinal} className="text-xs cursor-pointer">Cerrar Caja</Button>
          </div>
        </Modal>
      )}

      {/* INGRESO MODAL */}
      {showIngresoModal && (
        <Modal onClose={() => setShowIngresoModal(false)}>
          <div className="px-6 py-5">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Ingreso de efectivo</h3>

            <label className="block text-xs text-gray-500 mb-1">Monto</label>
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={movMonto}
                onChange={(e) => setMovMonto(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="0"
                autoFocus
              />
            </div>

            <label className="block text-xs text-gray-500 mb-1">Motivo (opcional)</label>
            <input
              value={movMotivo}
              onChange={(e) => setMovMotivo(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 mb-3"
              placeholder="Ej: Cambio chico"
            />

            <label className="block text-xs text-gray-500 mb-1">Nota (opcional)</label>
            <input
              value={movNota}
              onChange={(e) => setMovNota(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              placeholder="Nota adicional"
            />
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="ghost" size="sm" onClick={() => setShowIngresoModal(false)} className="text-xs cursor-pointer">Cancelar</Button>
            <Button size="sm" onClick={handleIngreso} disabled={!movMonto || parseFloat(movMonto) <= 0} className="text-xs cursor-pointer">Guardar</Button>
          </div>
        </Modal>
      )}

      {/* EGRESO MODAL */}
      {showEgresoModal && (
        <Modal onClose={() => setShowEgresoModal(false)}>
          <div className="px-6 py-5">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Egreso de efectivo</h3>

            <label className="block text-xs text-gray-500 mb-1">Monto</label>
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={movMonto}
                onChange={(e) => setMovMonto(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="0"
                autoFocus
              />
            </div>

            <label className="block text-xs text-gray-500 mb-1">Motivo (opcional)</label>
            <input
              value={movMotivo}
              onChange={(e) => setMovMotivo(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 mb-3"
              placeholder="Ej: Compra de insumos"
            />

            <label className="block text-xs text-gray-500 mb-1">Nota (opcional)</label>
            <input
              value={movNota}
              onChange={(e) => setMovNota(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              placeholder="Nota adicional"
            />
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="ghost" size="sm" onClick={() => setShowEgresoModal(false)} className="text-xs cursor-pointer">Cancelar</Button>
            <Button size="sm" onClick={handleEgreso} disabled={!movMonto || parseFloat(movMonto) <= 0} className="text-xs cursor-pointer">Guardar</Button>
          </div>
        </Modal>
      )}

      {/* RETIRO MODAL */}
      {showRetiroModal && (
        <Modal onClose={() => setShowRetiroModal(false)}>
          <div className="px-6 py-5">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Retiro de efectivo</h3>

            <label className="block text-xs text-gray-500 mb-1">Monto a retirar</label>
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={movMonto}
                onChange={(e) => setMovMonto(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="0"
                autoFocus
              />
            </div>

            {movMonto && parseFloat(movMonto) > 0 && (
              <div className="flex justify-between text-sm py-2 mb-3 border-t border-gray-100">
                <span className="text-gray-500">Saldo esperado despues del retiro</span>
                <span className="font-medium text-gray-700">{fmt(saldos.efectivo - (parseFloat(movMonto) || 0))}</span>
              </div>
            )}

            <label className="block text-xs text-gray-500 mb-1">Saldo contado (opcional)</label>
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={retiroContado}
                onChange={(e) => setRetiroContado(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="Cuanto queda en caja"
              />
            </div>

            <label className="block text-xs text-gray-500 mb-1">Nota (opcional)</label>
            <input
              value={movNota}
              onChange={(e) => setMovNota(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              placeholder="Ej: Guardado en caja fuerte"
            />
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="ghost" size="sm" onClick={() => setShowRetiroModal(false)} className="text-xs cursor-pointer">Cancelar</Button>
            <Button size="sm" onClick={handleRetiro} disabled={!movMonto || parseFloat(movMonto) <= 0} className="text-xs cursor-pointer">Aceptar</Button>
          </div>
        </Modal>
      )}
      </div>
      </div>
    </div>
  )
}
