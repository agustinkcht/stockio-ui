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
  Copy,
  Check,
  DollarSign,
} from "lucide-react"

// ─── Format helpers ─────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })
}
function fmtDateTime(iso: string) {
  const date = new Date(iso)
  const dateStr = date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })
  const timeStr = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })
  return dateStr + " - " + timeStr
}

// Format number with thousands separator (4525 -> "4.525")
function formatNumber(val: string): string {
  const num = val.replace(/\D/g, "")
  if (!num) return ""
  return Number(num).toLocaleString("es-AR")
}

// Parse formatted number back to number ("4.525" -> 4525)
function parseFormattedNumber(val: string): number {
  return Number(val.replace(/\./g, ""))
}

// ─── Movement timeline icon + color ────────────────────────
function movMeta(mov: CajaMovimiento) {
  switch (mov.tipo) {
    case "apertura":
      return { icon: Play, color: "text-gray-600", bg: "bg-gray-50", sign: "", label: mov.descripcion, tagLabel: "apertura", tagColor: "bg-gray-100 text-gray-600" }
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
      return { icon: Vault, color: "text-gray-600", bg: "bg-gray-50", sign: "-", label: "Retiro de efectivo", tagLabel: "retiro", tagColor: "bg-gray-100 text-gray-600" }
    default:
      return { icon: DollarSign, color: "text-gray-400", bg: "bg-gray-50", sign: "", label: "Movimiento", tagLabel: "", tagColor: "bg-gray-100 text-gray-500" }
  }
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
function Timeline({ movimientos, sesion, onOpenExplicacion }: { movimientos: CajaMovimiento[]; sesion?: CajaSesion; onOpenExplicacion?: () => void }) {
  // Sort descending (newest first)
  const sorted = [...movimientos].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (sorted.length === 0 && !sesion) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Clock className="w-8 h-8 mb-3 opacity-50" />
        <p className="text-sm">Sin movimientos</p>
      </div>
    )
  }

  const renderMovimiento = (mov: CajaMovimiento, i: number, total: number) => {
    const meta = movMeta(mov)
    const IconComp = meta.icon
    const isNeg = mov.tipo === "egreso" || mov.tipo === "retiro"

    return (
      <div
        key={mov.id}
        className={`flex items-start gap-4 px-5 py-3.5 ${i < total - 1 ? "border-b border-gray-100" : ""} hover:bg-gray-50/60 transition-colors`}
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
              {mov.usuario + (mov.nota ? " · " + mov.nota : "") + (mov.motivo ? " · " + mov.motivo : "")}
            </p>
          )}
        </div>

        {/* Amount */}
        <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${isNeg ? "text-red-500" : (mov.monto < 0 ? "text-red-500" : "text-gray-800")}`}>
          {meta.sign}{fmt(Math.abs(mov.monto))}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Cierre entry (snapshot from when caja was closed) */}
      {sesion?.cierre && (
        <div className={`flex items-start gap-4 px-5 py-3.5 bg-gray-50/60 ${sorted.length > 0 ? "border-b border-gray-100" : ""}`}>
          <span className="text-xs text-gray-400 font-mono w-12 pt-0.5 flex-shrink-0">
            {fmtTime(sesion.timestampCierre || sesion.timestampApertura)}
          </span>
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Square className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800">Cierre de Caja</span>
              <span className="text-xs text-gray-500">
                Saldo final esperado: <span className="font-medium text-gray-700">{fmt(sesion.cierre.saldoEsperadoEfectivo)}</span>
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-xs text-gray-500">
                Saldo final contado: <span className="font-medium text-gray-700">{fmt(sesion.cierre.saldoContadoEfectivo)}</span>
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-xs text-gray-500">
                Diferencia final: <span className={`font-medium ${sesion.cierre.diferenciaEfectivo < 0 ? "text-red-500" : "text-gray-700"}`}>{fmt(sesion.cierre.diferenciaEfectivo)}</span>
              </span>
              {sesion.cierre.diferenciaEfectivo !== 0 && (
                <>
                  <span className="text-gray-400">·</span>
                  {sesion.cierre.explicacionDiferencia ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">Explicada</span>
                      <button onClick={onOpenExplicacion} className="text-xs text-blue-600 hover:underline cursor-pointer">[ver explicación]</button>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-xs text-amber-600 font-medium">Pendiente de explicación</span>
                      <button onClick={onOpenExplicacion} className="text-xs text-blue-600 hover:underline cursor-pointer">[agregar explicación]</button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Movimientos (during session) */}
      {sorted.map((mov, i) => renderMovimiento(mov, i, sorted.length))}

      {/* Apertura entry (always last/oldest) */}
      {sesion && (
        <div className="flex items-start gap-4 px-5 py-3.5 bg-gray-50/60">
          <span className="text-xs text-gray-400 font-mono w-12 pt-0.5 flex-shrink-0">
            {fmtTime(sesion.timestampApertura)}
          </span>
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Play className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800">Apertura de Caja</span>
              <span className="text-xs text-gray-500">
                Saldo inicial contado: <span className="font-medium text-gray-700">{fmt(sesion.apertura.saldoInicialContado)}</span>
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Session History View ──────────────────────────────────
function HistorialView({ sesiones, onBack, onRevisar, onUpdateExplicacion }: { sesiones: CajaSesion[]; onBack: () => void; onRevisar: (s: CajaSesion) => void; onUpdateExplicacion: (sesionId: number, explicacion: string) => void }) {
  const closed = sesiones.filter((s) => s.estado === "cerrada").sort((a, b) => b.id - a.id)
  const [showExplicacionModal, setShowExplicacionModal] = useState(false)
  const [selectedSesion, setSelectedSesion] = useState<CajaSesion | null>(null)
  const [explicacionText, setExplicacionText] = useState("")
  const [isEditingExplicacion, setIsEditingExplicacion] = useState(false)

  const handleOpenExplicacion = (sesion: CajaSesion) => {
    setSelectedSesion(sesion)
    setExplicacionText(sesion.cierre?.explicacionDiferencia || "")
    setIsEditingExplicacion(!sesion.cierre?.explicacionDiferencia)
    setShowExplicacionModal(true)
  }

  const handleSaveExplicacion = () => {
    if (selectedSesion) {
      onUpdateExplicacion(selectedSesion.id, explicacionText)
      setShowExplicacionModal(false)
      setIsEditingExplicacion(false)
      setSelectedSesion(null)
    }
  }

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
                    {fmtDate(s.timestampApertura)} {fmtTime(s.timestampApertura)} - {s.timestampCierre ? fmtTime(s.timestampCierre) : ""} &middot; {s.responsable}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 mr-3">
                  <p className="text-xs text-gray-500 mb-0.5">
                    Saldo Final: <span className="font-semibold text-gray-800">{fmt(s.cierre?.saldoContadoEfectivo || 0)}</span>
                  </p>
                  <p className="text-xs text-gray-500 mb-0.5">
                    Diferencia Final: <span className={`font-medium ${(s.cierre?.diferenciaEfectivo || 0) < 0 ? "text-red-500" : "text-gray-600"}`}>
                      {fmt(s.cierre?.diferenciaEfectivo || 0)}
                    </span>
                  </p>
                  {s.cierre && s.cierre.diferenciaEfectivo !== 0 && (
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      {s.cierre.explicacionDiferencia ? (
                        <>
                          <Check className="w-3 h-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Explicada</span>
                          <button onClick={(e) => { e.stopPropagation(); handleOpenExplicacion(s) }} className="text-xs text-blue-600 hover:underline cursor-pointer">[ver explicación]</button>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span className="text-xs text-amber-600 font-medium">Pendiente</span>
                          <button onClick={(e) => { e.stopPropagation(); handleOpenExplicacion(s) }} className="text-xs text-blue-600 hover:underline cursor-pointer">[agregar]</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => onRevisar(s)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <Eye className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Explicacion Modal */}
      {showExplicacionModal && selectedSesion && (
        <Modal onClose={() => { setShowExplicacionModal(false); setIsEditingExplicacion(false); setSelectedSesion(null) }}>
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">{selectedSesion.cierre?.explicacionDiferencia ? "Explicación de la Diferencia" : "Agregar Explicación de Diferencia"}</h3>
              {!isEditingExplicacion && selectedSesion.cierre?.explicacionDiferencia && (
                <button onClick={() => { setShowExplicacionModal(false); setIsEditingExplicacion(false); setSelectedSesion(null) }} className="p-1 hover:bg-gray-100 rounded-md transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            
            <textarea
              value={explicacionText}
              onChange={(e) => setExplicacionText(e.target.value)}
              disabled={!isEditingExplicacion && !!selectedSesion.cierre?.explicacionDiferencia}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 min-h-[120px] resize-none disabled:bg-gray-50 disabled:text-gray-600"
              placeholder="Escribe aquí la explicación de la diferencia..."
            />
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            {!isEditingExplicacion && selectedSesion.cierre?.explicacionDiferencia ? (
              <Button size="sm" onClick={() => setIsEditingExplicacion(true)} className="text-xs cursor-pointer">Editar</Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => { setShowExplicacionModal(false); setIsEditingExplicacion(false); setSelectedSesion(null) }} className="text-xs cursor-pointer">Cancelar</Button>
                <Button size="sm" onClick={handleSaveExplicacion} disabled={!explicacionText.trim()} className="text-xs cursor-pointer">Guardar</Button>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Session Review View ───────────────────────────────────
function ReviewView({ sesion, onBack, onUpdateExplicacion }: { sesion: CajaSesion; onBack: () => void; onUpdateExplicacion: (sesionId: number, explicacion: string) => void }) {
  const [showExplicacionModal, setShowExplicacionModal] = useState(false)
  const [explicacionText, setExplicacionText] = useState(sesion.cierre?.explicacionDiferencia || "")
  const [isEditingExplicacion, setIsEditingExplicacion] = useState(false)

  const handleSaveExplicacion = () => {
    onUpdateExplicacion(sesion.id, explicacionText)
    setShowExplicacionModal(false)
    setIsEditingExplicacion(false)
  }

  const handleOpenExplicacion = () => {
    setExplicacionText(sesion.cierre?.explicacionDiferencia || "")
    setIsEditingExplicacion(!sesion.cierre?.explicacionDiferencia)
    setShowExplicacionModal(true)
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
            <p className="text-xs text-gray-400">{fmtDate(sesion.timestampApertura)} &middot; {sesion.responsable}</p>
          </div>
        </div>
      </div>

      {/* Summary widgets */}
      <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-gray-100">
        <div className={sesion.cierre ? "bg-gray-900 rounded-xl p-3" : "bg-gray-50 rounded-xl p-3"}>
          <p className={`text-[10px] uppercase tracking-wider mb-1 ${sesion.cierre ? "text-gray-400" : "text-gray-400"}`}>Efectivo</p>
          {sesion.cierre ? (
            <>
              <p className="text-xs text-gray-400 mb-0.5">Saldo Final Contado</p>
              <p className="text-base font-bold text-white">{fmt(sesion.cierre.saldoContadoEfectivo)}</p>
            </>
          ) : (
            <p className="text-base font-bold text-gray-800">{fmt(efectivo)}</p>
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
      <div className="flex-1 overflow-y-auto border-t border-gray-100">
        <Timeline movimientos={sesion.movimientos} sesion={sesion} onOpenExplicacion={handleOpenExplicacion} />
      </div>

      {/* Explicacion Modal */}
      {showExplicacionModal && (
        <Modal onClose={() => { setShowExplicacionModal(false); setIsEditingExplicacion(false) }}>
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">{sesion.cierre?.explicacionDiferencia ? "Explicación de la Diferencia" : "Agregar Explicación de Diferencia"}</h3>
              {!isEditingExplicacion && sesion.cierre?.explicacionDiferencia && (
                <button onClick={() => setShowExplicacionModal(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            
            <textarea
              value={explicacionText}
              onChange={(e) => setExplicacionText(e.target.value)}
              disabled={!isEditingExplicacion && !!sesion.cierre?.explicacionDiferencia}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 min-h-[120px] resize-none disabled:bg-gray-50 disabled:text-gray-600"
              placeholder="Escribe aquí la explicación de la diferencia..."
            />
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            {!isEditingExplicacion && sesion.cierre?.explicacionDiferencia ? (
              <Button size="sm" onClick={() => setIsEditingExplicacion(true)} className="text-xs cursor-pointer">Editar</Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => { setShowExplicacionModal(false); setIsEditingExplicacion(false) }} className="text-xs cursor-pointer">Cancelar</Button>
                <Button size="sm" onClick={handleSaveExplicacion} disabled={!explicacionText.trim()} className="text-xs cursor-pointer">Guardar</Button>
              </>
            )}
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
    actualizarExplicacion,
  } = useCaja()

  // View state
  const [view, setView] = useState<"main" | "historial" | "review">("main")
  const [reviewSesion, setReviewSesion] = useState<CajaSesion | null>(null)
  const [copied, setCopied] = useState(false)

  // Modal state
  const [showIniciarModal, setShowIniciarModal] = useState(false)
  const [showIniciarConfirm, setShowIniciarConfirm] = useState(false)
  const [showCerrarModal, setShowCerrarModal] = useState(false)
  const [showCerrarResumen, setShowCerrarResumen] = useState(false)
  const [showSuccess, setShowSuccess] = useState<string | null>(null)

  // Ingreso / Egreso / Retiro modals
  const [showIngresoModal, setShowIngresoModal] = useState(false)
  const [showEgresoModal, setShowEgresoModal] = useState(false)
  const [showRetiroModal, setShowRetiroModal] = useState(false)

  // Form state
  const [saldoContadoInput, setSaldoContadoInput] = useState("")
  const [movMonto, setMovMonto] = useState("")
  const [movMotivo, setMovMotivo] = useState("")
  const [retiroContado, setRetiroContado] = useState("")

  // Computed values
  const saldoContadoNum = saldoContadoInput ? parseFormattedNumber(saldoContadoInput) : 0
  const saldoInicialEsperado = ultimaSesionCerrada?.cierre?.saldoContadoEfectivo || 0
  const diferenciaInicial = saldoContadoNum - saldoInicialEsperado

  const saldos = useMemo(() => {
    if (!sesionActiva) return { efectivo: 0, posnet: 0, transferencia: 0 }
    return calcularSaldoEsperado(sesionActiva)
  }, [sesionActiva, calcularSaldoEsperado])

  const nextSessionId = sesiones.length > 0 ? Math.max(...sesiones.map((s) => s.id)) + 1 : 1

  // Cerrar state
  const [cerrarSaldoContado, setCerrarSaldoContado] = useState("")
  const cerrarSaldoContadoNum = cerrarSaldoContado ? parseFormattedNumber(cerrarSaldoContado) : 0
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
    cerrarSesion(cerrarSaldoContadoNum)
    setShowCerrarResumen(false)
    setCerrarSaldoContado("")
    setShowSuccess("Caja cerrada con exito")
    setTimeout(() => setShowSuccess(null), 2500)
  }

  const handleIngreso = () => {
    const m = movMonto ? parseFormattedNumber(movMonto) : 0
    if (m <= 0) return
    agregarMovimiento({
      tipo: "ingreso",
      monto: m,
      descripcion: "Ingreso manual",
      motivo: movMotivo || undefined,
      medioPago: "efectivo",
    })
    setShowIngresoModal(false)
    resetMovForm()
  }

  const handleEgreso = () => {
    const m = movMonto ? parseFormattedNumber(movMonto) : 0
    if (m <= 0) return
    agregarMovimiento({
      tipo: "egreso",
      monto: m,
      descripcion: "Egreso manual",
      motivo: movMotivo || undefined,
      medioPago: "efectivo",
    })
    setShowEgresoModal(false)
    resetMovForm()
  }

  const handleRetiro = () => {
    const m = movMonto ? parseFormattedNumber(movMonto) : 0
    if (m <= 0) return
    agregarMovimiento({
      tipo: "retiro",
      monto: m,
      descripcion: "Retiro de efectivo",
      medioPago: "efectivo",
    })
    setShowRetiroModal(false)
    resetMovForm()
  }

  const resetMovForm = () => {
    setMovMonto("")
    setMovMotivo("")
  }

  const handleRevisar = (s: CajaSesion) => {
    setReviewSesion(s)
    setView("review")
  }

  const handleUpdateExplicacion = (sesionId: number, explicacion: string) => {
    actualizarExplicacion(sesionId, explicacion)
    // Refresh the review sesion
    const updated = sesiones.find((s) => s.id === sesionId)
    if (updated) setReviewSesion(updated)
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
        <div onClick={(e) => e.stopPropagation()} className="relative h-[calc(100vh-12px)] sticky top-[6px] z-[100003]">
          <Sidebar
            sidebarItems={SIDEBAR_ITEMS}
            bottomSidebarItems={BOTTOM_SIDEBAR_ITEMS}
            hoveredDropdown={hoveredDropdown}
            onDropdownOpen={handleDropdownMouseEnter}
            onDropdownClose={handleDropdownMouseLeave}
          />
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm h-[calc(100vh-12px)] overflow-hidden relative z-10">
          <div className="relative border-b border-border h-[44px] bg-white z-[100004]">
            <div className="px-4 flex items-center justify-between h-full">
              <div className="flex items-center">
                <Breadcrumb items={breadcrumbs} />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <UserPanel />
              </div>
              <div className="flex items-center gap-2 min-w-[280px] justify-end" />
            </div>
          </div>

          <main className="flex-1 flex bg-[rgba(250,251,253,1)] overflow-hidden">
            <div className="flex-1 flex flex-col overflow-auto">
              <div className="px-8 pb-8 pt-4">
                <div className="w-full bg-white rounded-xl border border-gray-200/60 shadow-sm flex flex-col min-h-0 overflow-hidden">

            {/* ── HISTORIAL VIEW ─────────────────────────── */}
            {view === "historial" && (
              <HistorialView
                sesiones={sesiones}
                onBack={() => setView("main")}
                onRevisar={handleRevisar}
                onUpdateExplicacion={handleUpdateExplicacion}
              />
            )}

            {/* ── REVIEW VIEW ────────────────────────────── */}
            {view === "review" && reviewSesion && (
              <ReviewView
                sesion={sesiones.find((s) => s.id === reviewSesion.id) || reviewSesion}
                onBack={() => { setView("historial"); setReviewSesion(null) }}
                onUpdateExplicacion={handleUpdateExplicacion}
              />
            )}

            {/* ── MAIN VIEW ──────────────────────────────── */}
            {view === "main" && !sesionActiva && (
              /* ─── STATE 1: SESION INACTIVA ──────────────── */
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                  <Vault className="w-7 h-7 text-gray-400" />
                </div>
                <h2 className="font-semibold text-gray-800 mb-1 text-xl">No hay caja abierta</h2>

                {ultimaSesionCerrada ? (
                  <div className="text-center mb-6">
                    <p className="text-gray-400 mt-2 text-sm">
                      Ultima sesion: <span className="font-medium text-gray-500">#{ultimaSesionCerrada.id}</span>
                      &nbsp;&middot;&nbsp;{fmtDate(ultimaSesionCerrada.timestampCierre || ultimaSesionCerrada.timestampApertura)}
                      &nbsp;&middot;&nbsp;
                      <span className="font-medium text-gray-500">{ultimaSesionCerrada.estado}</span>
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <p className="text-gray-400 text-sm">
                        Saldo final: <span className="font-medium text-gray-600">{fmt(ultimaSesionCerrada.cierre?.saldoContadoEfectivo || 0)}</span>
                      </p>
                      <button
                        onClick={() => {
                          const valor = String(ultimaSesionCerrada.cierre?.saldoContadoEfectivo || 0)
                          navigator.clipboard.writeText(valor)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                        title="Copiar saldo"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="text-gray-400 w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button
                        onClick={() => handleRevisar(ultimaSesionCerrada)}
                        className="text-gray-500 hover:text-gray-700 underline underline-offset-2 cursor-pointer transition-colors text-sm"
                      >
                        Revisar
                      </button>
                      <span className="text-gray-300">&middot;</span>
                      <button
                        onClick={() => setView("historial")}
                        className="text-gray-500 hover:text-gray-700 underline underline-offset-2 cursor-pointer transition-colors text-sm"
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
                    Retiro
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
                    <span className="text-xs text-gray-400">&middot;</span>
                    <span className="text-xs text-gray-400">{sesionActiva.responsable}</span>
                    <span className="text-xs text-gray-400 ml-auto">#{sesionActiva.id} &middot; Desde {fmtTime(sesionActiva.timestampApertura)}</span>
                  </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto">
                  <Timeline movimientos={sesionActiva.movimientos} sesion={sesionActiva} />
                  </div>
                </div>
              </div>
            )}
                </div>
              </div>
            </div>
          </main>
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
          <div className="px-6 py-6">
            <h3 className="text-base font-semibold text-gray-800 mb-6">Iniciar Caja</h3>

            <label className="block text-base font-medium text-gray-800 mb-3">¿Cuánto efectivo hay en la caja?</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={saldoContadoInput}
                onChange={(e) => {
                  const formatted = formatNumber(e.target.value)
                  setSaldoContadoInput(formatted)
                }}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="0"
                autoFocus
              />
            </div>
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
                <span className="text-gray-500">Saldo inicial contado</span>
                <span className="font-medium text-gray-700">{fmt(saldoContadoNum)}</span>
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
          <div className="px-6 py-6">
            <h3 className="text-base font-semibold text-gray-800 mb-6">Cerrar Caja</h3>

            <label className="block text-base font-medium text-gray-800 mb-3">¿Cuánto efectivo hay en la caja?</label>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={cerrarSaldoContado}
                onChange={(e) => {
                  const formatted = formatNumber(e.target.value)
                  setCerrarSaldoContado(formatted)
                }}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="0"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Saldo esperado en efectivo</span>
                <span className="font-semibold text-gray-800">{fmt(saldos.efectivo)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Diferencia</span>
                <span className={`font-semibold ${cerrarDiferencia === 0 ? "text-gray-600" : cerrarDiferencia > 0 ? "text-green-600" : "text-red-500"}`}>
                  {(cerrarDiferencia >= 0 ? "+" : "") + fmt(cerrarDiferencia)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="ghost" size="sm" onClick={() => setShowCerrarModal(false)} className="text-xs cursor-pointer">Cancelar</Button>
            <Button size="sm" onClick={handleCerrarNext} disabled={!cerrarSaldoContado} className="text-xs cursor-pointer">Aceptar</Button>
          </div>
        </Modal>
      )}

      {/* CERRAR CAJA - Step 2 Resumen & Confirmation */}
      {showCerrarResumen && sesionActiva && (
        <Modal onClose={() => setShowCerrarResumen(false)}>
          <div className="px-6 py-5">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Vas a cerrar la caja</h3>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sesion</span>
                <span className="font-semibold text-gray-800">#{sesionActiva.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fecha y hora de inicio</span>
                <span className="font-medium text-gray-700">{fmtDateTime(sesionActiva.timestampApertura)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fecha y hora de cierre</span>
                <span className="font-medium text-gray-700">{fmtDateTime(new Date().toISOString())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Usuario responsable</span>
                <span className="font-medium text-gray-700">{sesionActiva.responsable}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Resumen de la sesion</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Saldo esperado en efectivo</span>
                  <span className="font-medium text-gray-700">{fmt(saldos.efectivo)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Saldo contado en efectivo</span>
                  <span className="font-medium text-gray-700">{fmt(cerrarSaldoContadoNum)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Diferencia</span>
                  <span className={`font-semibold ${cerrarDiferencia === 0 ? "text-gray-600" : cerrarDiferencia > 0 ? "text-green-600" : "text-red-500"}`}>
                    {(cerrarDiferencia >= 0 ? "+" : "") + fmt(cerrarDiferencia)}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-2.5 mt-2.5">
                  <p className="text-xs font-medium text-gray-600 mb-2">Otros medios de pago</p>
                  <div className="space-y-2">
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
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="ghost" size="sm" onClick={() => { setShowCerrarResumen(false); setShowCerrarModal(true) }} className="text-xs cursor-pointer">Revisar</Button>
            <Button size="sm" onClick={handleCerrarConfirm} className="text-xs cursor-pointer">
              <Square className="w-3 h-3 mr-1.5" />
              Cerrar Caja
            </Button>
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
                type="text"
                inputMode="numeric"
                value={movMonto}
                onChange={(e) => {
                  const formatted = formatNumber(e.target.value)
                  setMovMonto(formatted)
                }}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="0"
                autoFocus
              />
            </div>

            <label className="block text-xs text-gray-500 mb-1">Motivo (opcional)</label>
            <input
              value={movMotivo}
              onChange={(e) => setMovMotivo(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              placeholder="Ej: Cambio chico"
            />
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="ghost" size="sm" onClick={() => setShowIngresoModal(false)} className="text-xs cursor-pointer">Cancelar</Button>
            <Button size="sm" onClick={handleIngreso} disabled={!movMonto || parseFormattedNumber(movMonto) <= 0} className="text-xs cursor-pointer">Guardar</Button>
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
                type="text"
                inputMode="numeric"
                value={movMonto}
                onChange={(e) => {
                  const formatted = formatNumber(e.target.value)
                  setMovMonto(formatted)
                }}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="0"
                autoFocus
              />
            </div>

            <label className="block text-xs text-gray-500 mb-1">Motivo (opcional)</label>
            <input
              value={movMotivo}
              onChange={(e) => setMovMotivo(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              placeholder="Ej: Compra de insumos"
            />
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="ghost" size="sm" onClick={() => setShowEgresoModal(false)} className="text-xs cursor-pointer">Cancelar</Button>
            <Button size="sm" onClick={handleEgreso} disabled={!movMonto || parseFormattedNumber(movMonto) <= 0} className="text-xs cursor-pointer">Guardar</Button>
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
                type="text"
                inputMode="numeric"
                value={movMonto}
                onChange={(e) => {
                  const formatted = formatNumber(e.target.value)
                  setMovMonto(formatted)
                }}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="0"
                autoFocus
              />
            </div>

            <label className="block text-xs text-gray-500 mb-1">Saldo contado</label>
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={retiroContado}
                onChange={(e) => {
                  const formatted = formatNumber(e.target.value)
                  setRetiroContado(formatted)
                }}
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                placeholder="Saldo que queda en caja"
              />
            </div>

            <label className="block text-xs text-gray-500 mb-1">Motivo (opcional)</label>
            <input
              value={movMotivo}
              onChange={(e) => setMovMotivo(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              placeholder="Ej: Guardado en caja fuerte"
            />
          </div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <Button variant="ghost" size="sm" onClick={() => setShowRetiroModal(false)} className="text-xs cursor-pointer">Cancelar</Button>
            <Button size="sm" onClick={handleRetiro} disabled={!movMonto || parseFormattedNumber(movMonto) <= 0 || !retiroContado} className="text-xs cursor-pointer">Aceptar</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
